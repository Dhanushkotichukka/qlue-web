export type ResumeStatus = 'pending' | 'uploading' | 'parsing' | 'parsed' | 'failed';

export function parseResumeStatus(s?: string): ResumeStatus {
  switch ((s ?? '').toLowerCase()) {
    case 'pending':
      return 'pending';
    case 'uploading':
      return 'uploading';
    case 'parsing':
      return 'parsing';
    case 'parsed':
      return 'parsed';
    default:
      return 'failed';
  }
}

export interface Contact {
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}

export interface WorkExperience {
  company?: string | null;
  role?: string | null;
  duration?: string | null;
  highlights?: string[] | null;
}

export interface Project {
  name?: string | null;
  technologies?: string[] | null;
  description?: string | null;
}

export interface Education {
  institution?: string | null;
  degree?: string | null;
  year?: string | null;
}

export interface ParsedData {
  name?: string | null;
  contact?: Contact | null;
  skills?: string[] | null;
  workExperience?: WorkExperience[] | null;
  projects?: Project[] | null;
  education?: Education[] | null;
}

export interface Resume {
  resumeId: string;
  userId?: string | null;
  fileName: string;
  fileSize: number;
  fileHash?: string | null;
  s3Key?: string | null;
  status: ResumeStatus;
  uploadedAt?: number | null;
  isActive: boolean;
  failReason?: string | null;
  parsedData?: ParsedData | null;
}

export function parseResume(json: any): Resume {
  return {
    resumeId: json.resumeId,
    userId: json.userId ?? null,
    fileName: json.fileName,
    fileSize: Number(json.fileSize ?? 0),
    fileHash: json.fileHash ?? null,
    s3Key: json.s3Key ?? null,
    status: parseResumeStatus(json.status),
    uploadedAt: json.uploadedAt != null ? Number(json.uploadedAt) : null,
    isActive: json.isActive === true,
    failReason: json.failReason ?? null,
    parsedData: json.parsedData ?? null,
  };
}
