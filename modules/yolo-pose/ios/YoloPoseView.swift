import ExpoModulesCore
import Vision
import UIKit
import AVFoundation
import CoreML

enum YoloPoseViewError: Error {
    case mlModelNotFound
    case mlModelLoadingFailed(Error)
    case videoDeviceInputCreationFailed
    case cannotAddVideoInput
    case cannotAddVideoOutput
}

public class YoloPoseView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate {
    private let previewView = UIView()
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private let onResult = EventDispatcher()
    private let session = AVCaptureSession()
    private var bufferSize: CGSize = .zero
    private var requests = [VNRequest]()
    
    // YOLO Pose parameters
    private let confidenceThreshold: Float = 0.25
    private let numKeypoints = 17

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupCaptureSession()
    }

    private func setupCaptureSession() {
        do {
            try setupCapture()
            try setupOutput()
            try setupVision()
            setupPreviewLayer()
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.session.startRunning()
            }
        } catch {
            print("❌ Error setting up capture session: \(error)")
        }
    }

    private func setupCapture() throws {
        guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let deviceInput = try? AVCaptureDeviceInput(device: videoDevice) else {
            throw YoloPoseViewError.videoDeviceInputCreationFailed
        }

        session.beginConfiguration()

        guard session.canAddInput(deviceInput) else {
            throw YoloPoseViewError.cannotAddVideoInput
        }

        session.addInput(deviceInput)
        setupBufferSize(for: videoDevice)
        session.commitConfiguration()
    }

    private func setupOutput() throws {
        let videoDataOutput = AVCaptureVideoDataOutput()
        let videoDataOutputQueue = DispatchQueue(
            label: "VideoDataOutput",
            qos: .userInitiated,
            attributes: [],
            autoreleaseFrequency: .workItem
        )

        guard session.canAddOutput(videoDataOutput) else {
            throw YoloPoseViewError.cannotAddVideoOutput
        }

        session.addOutput(videoDataOutput)
        videoDataOutput.alwaysDiscardsLateVideoFrames = true
        videoDataOutput.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String:
            Int(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange)
        ]
        videoDataOutput.setSampleBufferDelegate(self, queue: videoDataOutputQueue)
    }

    private func setupVision() throws {
        guard let modelURL = Bundle.main.url(
            forResource: "yolo11n-pose-int8",
            withExtension: "mlmodelc"
        ) else {
            throw YoloPoseViewError.mlModelNotFound
        }
        
        do {
            let mlModel = try MLModel(contentsOf: modelURL)
            let visionModel = try VNCoreMLModel(for: mlModel)
            
            let detectionRequest = VNCoreMLRequest(
                model: visionModel,
                completionHandler: handleDetection
            )
            self.requests = [detectionRequest]
        } catch {
            throw YoloPoseViewError.mlModelLoadingFailed(error)
        }
    }

    private func setupPreviewLayer() {
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        previewLayer = layer
        previewView.layer.addSublayer(layer)
        addSubview(previewView)
    }

    private func setupBufferSize(for videoDevice: AVCaptureDevice) {
        do {
            try videoDevice.lockForConfiguration()
            let dimensions = CMVideoFormatDescriptionGetDimensions(
                videoDevice.activeFormat.formatDescription
            )
            bufferSize.width = CGFloat(dimensions.width)
            bufferSize.height = CGFloat(dimensions.height)
            videoDevice.unlockForConfiguration()
        } catch {
            print("⚠️ Failed to lock video device: \(error)")
        }
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        previewView.frame = bounds
        previewLayer?.frame = previewView.bounds
    }

    private func handleDetection(request: VNRequest, error: Error?) {
        if let error = error {
            print("❌ Detection error: \(error)")
            return
        }
        
        guard let results = request.results as? [VNCoreMLFeatureValueObservation],
              let firstResult = results.first,
              let multiArray = firstResult.featureValue.multiArrayValue else {
            return
        }
        
        let shape = multiArray.shape.map { $0.intValue }
        var allPoses: [[String: Any]] = []
        
        // Iterate through all detections
        for i in 0..<shape[2] {
            let confIndex = [0, 4, i] as [NSNumber]
            let confidence = multiArray[confIndex].floatValue
            
            if confidence > confidenceThreshold {
                // Get bounding box
                let xIndex = [0, 0, i] as [NSNumber]
                let yIndex = [0, 1, i] as [NSNumber]
                let wIndex = [0, 2, i] as [NSNumber]
                let hIndex = [0, 3, i] as [NSNumber]
                
                let centerX = multiArray[xIndex].floatValue
                let centerY = multiArray[yIndex].floatValue
                let width = multiArray[wIndex].floatValue
                let height = multiArray[hIndex].floatValue
                
                // Get keypoints for THIS person
                var keypoints: [[String: Any]] = []
                for kp in 0..<numKeypoints {
                    let baseIdx = 5 + (kp * 3)
                    let xIdx = [0, baseIdx, i] as [NSNumber]
                    let yIdx = [0, baseIdx + 1, i] as [NSNumber]
                    let confIdx = [0, baseIdx + 2, i] as [NSNumber]
                    
                    keypoints.append([
                        "x": Double(multiArray[xIdx].floatValue),
                        "y": Double(multiArray[yIdx].floatValue),
                        "confidence": Double(multiArray[confIdx].floatValue)
                    ])
                }
                
                // Add THIS person's pose
                allPoses.append([
                    "bbox": [
                        "x": Double(centerX),
                        "y": Double(centerY),
                        "width": Double(width),
                        "height": Double(height)
                    ],
                    "confidence": Double(confidence),
                    "keypoints": keypoints
                ])
            }
        }
        
        print("✅ Detected \(allPoses.count) people with \(allPoses.count * numKeypoints) total keypoints")
        
        DispatchQueue.main.async { [weak self] in
            self?.onResult(["poses": allPoses])
        }
    }

    public func captureOutput(
        _ output: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return
        }

        let imageRequestHandler = VNImageRequestHandler(
            cvPixelBuffer: pixelBuffer,
            orientation: .right,
            options: [:]
        )
        do {
            try imageRequestHandler.perform(self.requests)
        } catch {
            print("❌ Failed to perform request: \(error)")
        }
    }
}
