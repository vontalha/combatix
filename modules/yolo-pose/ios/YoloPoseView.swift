import ExpoModulesCore
import UIKit
import AVFoundation
import CoreML

// COCO skeleton (17 keypoints)
private let poseSkeletonEdges: [[Int]] = [
  [16, 14], [14, 12], [17, 15], [15, 13], [12, 13],
  [6, 12], [7, 13], [6, 7], [6, 8], [7, 9],
  [8, 10], [9, 11], [2, 3], [1, 2], [1, 3],
  [2, 4], [3, 5], [4, 6], [5, 7]
]

private let keypointColors: [UIColor] = (0..<17).map {
  UIColor(hue: CGFloat($0) / 17.0, saturation: 1, brightness: 1, alpha: 1)
}

public class YoloPoseView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate {
  // UI
  private let previewView = UIView()
  private let overlayView = UIImageView()
  private var previewLayer: AVCaptureVideoPreviewLayer?

  // Events
  public let onResult = EventDispatcher()

  // Camera
  private let session = AVCaptureSession()

  // Model
  private var model: MLModel?
  private let numKeypoints = 17
  private let modelInputSize = CGSize(width: 640, height: 640) // Fallback
  private let confidenceThreshold: Float = 0.5
  private let iouThreshold: Float = 0.6

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupUI()
    setupCamera()
    loadModel()
  }

  private func setupUI() {
    addSubview(previewView)
    addSubview(overlayView)
    overlayView.contentMode = .scaleAspectFill
    overlayView.backgroundColor = .clear
  }

  private func setupCamera() {
    session.beginConfiguration()
    session.sessionPreset = .hd1280x720

    guard
      let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
      let input = try? AVCaptureDeviceInput(device: device)
    else { return }

    if session.canAddInput(input) { session.addInput(input) }

    let output = AVCaptureVideoDataOutput()
    output.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)
    ]
    output.setSampleBufferDelegate(self, queue: DispatchQueue(label: "VideoQueue"))
    if session.canAddOutput(output) { session.addOutput(output) }

    output.connection(with: .video)?.videoOrientation = .portrait
    session.commitConfiguration()

    let layer = AVCaptureVideoPreviewLayer(session: session)
    layer.videoGravity = .resizeAspectFill
    previewLayer = layer
    previewView.layer.addSublayer(layer)

    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      self?.session.startRunning()
    }
  }

  private func loadModel() {
    guard
      let url = Bundle.main.url(forResource: "yolo11n-pose-int8", withExtension: "mlmodelc")
        ?? Bundle.main.url(forResource: "yolo11n-pose-int8", withExtension: "mlpackage")
    else {
      print("❌ Model not found")
      return
    }
    model = try? MLModel(contentsOf: url)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    previewView.frame = bounds
    overlayView.frame = bounds
    previewLayer?.frame = previewView.bounds
  }

  // MARK: - Capture delegate
  public func captureOutput(_ output: AVCaptureOutput,
                            didOutput sampleBuffer: CMSampleBuffer,
                            from connection: AVCaptureConnection) {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
          let model = model else { return }
    DispatchQueue.global(qos: .userInitiated).async {
      self.inferPose(on: pixelBuffer, using: model)
    }
  }

  // MARK: - Inference
  private func inferPose(on pixelBuffer: CVPixelBuffer, using model: MLModel) {
    let imgW = CGFloat(CVPixelBufferGetWidth(pixelBuffer))
    let imgH = CGFloat(CVPixelBufferGetHeight(pixelBuffer))

    // --- 1) Ermittle exakte Input-Constraints ---
    // Name des Image-Inputs
    let inputName: String = {
      for (name, desc) in model.modelDescription.inputDescriptionsByName {
        if desc.type == .image { return name }
      }
      return "image"
    }()

    guard let inputDesc = model.modelDescription.inputDescriptionsByName[inputName],
          let constraint = inputDesc.imageConstraint else {
      return
    }

    // Zielgröße/Format GENAU nach Constraint
    let targetW = constraint.pixelsWide
    let targetH = constraint.pixelsHigh
    let targetFormat = constraint.pixelFormatType
    let targetSize = CGSize(width: targetW, height: targetH)

    // Letterbox-Parameter bezogen auf targetSize (z. B. 640×640)
    let r   = min(CGFloat(targetW) / imgW, CGFloat(targetH) / imgH)
    let newW = imgW * r
    let newH = imgH * r
    let dw  = (CGFloat(targetW) - newW) / 2
    let dh  = (CGFloat(targetH) - newH) / 2

    // --- 2) Resizen in GENAU dieses Format + IOSurface ---
    guard let resized = pixelBuffer.resized(to: targetSize, pixelFormat: targetFormat) else { return }

    // --- 3) Prediction mit genau diesem PixelBuffer ---
    let inDict: [String: MLFeatureValue] = [
      inputName: MLFeatureValue(pixelBuffer: resized)
    ]
    guard let provider = try? MLDictionaryFeatureProvider(dictionary: inDict),
          let output = try? model.prediction(from: provider) else { return }

    // --- 4) MultiArray-Output robust finden ---
    let array: MLMultiArray? = {
      for name in output.featureNames {
        if let fv = output.featureValue(for: name),
           let m = fv.multiArrayValue {
          return m
        }
      }
      return nil
    }()
    guard let multi = array else { return }

    // Erwartet: [1, 56, 8400]
    let shape = multi.shape.map { $0.intValue }
    guard shape.count == 3 else { return }
    let numAnchors = shape[2]

    var boxes: [CGRect] = []
    var scores: [Float] = []
    var feats: [[Float]] = []

    // --- 5) Korrekte 3D-Indexierung ---
    for i in 0..<numAnchors {
      let obj = multi[[0, 4, i] as [NSNumber]].floatValue
      if obj < confidenceThreshold { continue }

      let cx = multi[[0, 0, i] as [NSNumber]].floatValue
      let cy = multi[[0, 1, i] as [NSNumber]].floatValue
      let w  = multi[[0, 2, i] as [NSNumber]].floatValue
      let h  = multi[[0, 3, i] as [NSNumber]].floatValue

      var feat = [Float](repeating: 0, count: 51)
      for k in 0..<51 {
        feat[k] = multi[[0, 5 + k, i] as [NSNumber]].floatValue
      }

      let rect = CGRect(x: CGFloat(cx - w/2), y: CGFloat(cy - h/2),
                        width: CGFloat(w), height: CGFloat(h))
      boxes.append(rect)
      scores.append(obj)
      feats.append(feat)
    }

    // --- 6) NMS (IoU) ---
    let keep = nms(boxes: boxes, scores: scores, iou: iouThreshold)

    // --- 7) Rückprojektion Modell→Bildraum (undo Letterbox) ---
    func toImage(_ x: Float, _ y: Float) -> CGPoint {
      let X = (CGFloat(x) - dw) / r
      let Y = (CGFloat(y) - dh) / r
      return CGPoint(x: X, y: Y)
    }

    var poses: [[String: Any]] = []

    for idx in keep {
      let box = boxes[idx]
      let score = scores[idx]
      let feat = feats[idx]

      let cpt = toImage(Float(box.midX), Float(box.midY))
      let iw = CGFloat(box.width)  / r
      let ih = CGFloat(box.height) / r
      let rect = CGRect(x: cpt.x - iw/2, y: cpt.y - ih/2, width: iw, height: ih)

      var keypoints: [[String: Any]] = []
      keypoints.reserveCapacity(numKeypoints)
      for k in 0..<numKeypoints {
        let kx = feat[3*k]
        let ky = feat[3*k + 1]
        let kc = feat[3*k + 2]
        let pt = toImage(kx, ky)
        keypoints.append([
          "x": Double(pt.x),
          "y": Double(pt.y),
          "confidence": Double(kc)
        ])
      }

      let bboxDict: [String: Double] = [
        "x": Double(rect.origin.x),
        "y": Double(rect.origin.y),
        "width": Double(rect.width),
        "height": Double(rect.height)
      ]
      let poseDict: [String: Any] = [
        "bbox": bboxDict,
        "confidence": Double(score),
        "keypoints": keypoints
      ]
      poses.append(poseDict)
    }

    DispatchQueue.main.async {
      let annotated = self.draw(poses: poses,
                                on: CGSize(width: imgW, height: imgH))
      self.overlayView.image = annotated
      self.onResult(["poses": poses])
    }
  }

  // MARK: - Drawing
  private func draw(poses: [[String: Any]], on size: CGSize) -> UIImage {
    let renderer = UIGraphicsImageRenderer(size: size)
    return renderer.image { ctx in
      let cg = ctx.cgContext
      cg.setLineWidth(3)
      cg.setLineCap(.round)

      for pose in poses {
        guard let kps = pose["keypoints"] as? [[String: Any]] else { continue }

        var pts = [CGPoint?]()
        var confs = [Double]()
        for kp in kps {
          let x = kp["x"] as? Double ?? 0
          let y = kp["y"] as? Double ?? 0
          let c = kp["confidence"] as? Double ?? 0
          pts.append(c > 0.5 ? CGPoint(x: x, y: y) : nil)
          confs.append(c)
        }

        // Skeleton
        for edge in poseSkeletonEdges {
          let i1 = edge[0]-1, i2 = edge[1]-1
          guard i1 >= 0, i2 >= 0, i1 < pts.count, i2 < pts.count,
                let p1 = pts[i1], let p2 = pts[i2],
                confs[i1] > 0.5, confs[i2] > 0.5 else { continue }
          cg.setStrokeColor(keypointColors[i1 % 17].cgColor)
          cg.move(to: p1); cg.addLine(to: p2); cg.strokePath()
        }

        // Punkte
        for (i, p) in pts.enumerated() where confs[i] > 0.5 {
          guard let pt = p else { continue }
          cg.setFillColor(keypointColors[i % 17].cgColor)
          cg.fillEllipse(in: CGRect(x: pt.x-4, y: pt.y-4, width: 8, height: 8))
        }
      }
    }
  }

  // MARK: - NMS (IoU)
  private func nms(boxes: [CGRect], scores: [Float], iou: Float) -> [Int] {
    let order = scores.enumerated().sorted { $0.element > $1.element }.map { $0.offset }
    var keep = [Int]()
    var active = [Bool](repeating: true, count: boxes.count)

    func IoU(_ a: CGRect, _ b: CGRect) -> Float {
      let inter = a.intersection(b)
      if inter.isNull { return 0 }
      let i = Float(inter.width * inter.height)
      let u = Float(a.width * a.height + b.width * b.height) - i
      return i / max(u, 1e-6)
    }

    for i in 0..<order.count {
      let idx = order[i]
      if !active[idx] { continue }
      keep.append(idx)
      for j in i+1..<order.count {
        let jdx = order[j]
        if active[jdx], IoU(boxes[idx], boxes[jdx]) > iou {
          active[jdx] = false
        }
      }
    }
    return keep
  }
}

// MARK: - Helpers
fileprivate extension CVPixelBuffer {
  func resized(to size: CGSize, pixelFormat: OSType) -> CVPixelBuffer? {
    // Ziel-PixelBuffer mit KORREKTEM Pixel-Format + IOSurface anlegen
    let attrs: [CFString: Any] = [
      kCVPixelBufferCGImageCompatibilityKey: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey: true,
      kCVPixelBufferIOSurfacePropertiesKey: [:] // -> erzeugt IOSurface
    ] as [CFString : Any]

    var dst: CVPixelBuffer?
    CVPixelBufferCreate(nil,
                        Int(size.width), Int(size.height),
                        pixelFormat,
                        attrs as CFDictionary,
                        &dst)
    guard let out = dst else { return nil }

    // Mit CoreImage skalieren (CIContext respektiert das gewünschte Format)
    let srcW = CVPixelBufferGetWidth(self)
    let srcH = CVPixelBufferGetHeight(self)

    var ciImage = CIImage(cvPixelBuffer: self)
    let sx = size.width / CGFloat(srcW)
    let sy = size.height / CGFloat(srcH)
    ciImage = ciImage.transformed(by: CGAffineTransform(scaleX: sx, y: sy))

    let context = CIContext()
    context.render(ciImage, to: out)
    return out
  }
}
