export const KEYPOINT_NAMES = [
  'nose',           // 0
  'left_eye',       // 1
  'right_eye',      // 2
  'left_ear',       // 3
  'right_ear',      // 4
  'left_shoulder',  // 5
  'right_shoulder', // 6
  'left_elbow',     // 7
  'right_elbow',    // 8
  'left_wrist',     // 9
  'right_wrist',    // 10
  'left_hip',       // 11
  'right_hip',      // 12
  'left_knee',      // 13
  'right_knee',     // 14
  'left_ankle',     // 15
  'right_ankle'     // 16
] as const;

export type KeypointName = typeof KEYPOINT_NAMES[number];

// YOLO Skeleton Connections
export const SKELETON_CONNECTIONS = [
  // Face
  [0, 1], [0, 2],       // nose to eyes
  [1, 3], [2, 4],       // eyes to ears
  
  // Torso
  [5, 6],               // shoulders
  [5, 11], [6, 12],     // shoulders to hips
  [11, 12],             // hips
  
  // Left Arm
  [5, 7], [7, 9],       // shoulder -> elbow -> wrist
  
  // Right Arm
  [6, 8], [8, 10],      // shoulder -> elbow -> wrist
  
  // Left Leg
  [11, 13], [13, 15],   // hip -> knee -> ankle
  
  // Right Leg
  [12, 14], [14, 16],   // hip -> knee -> ankle
] as const;

export interface Keypoint {
  x: number;
  y: number;
  confidence: number;
}

export interface Pose {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  keypoints: Keypoint[];
}
