import axios from 'axios';
import { api } from '@/lib/apiClient';
import { Api } from '@/config/env';
import { parseResume, type Resume } from '@/types/resume';

export interface PresignedUrlData {
  uploadUrl: string;
  resumeId: string;
  [k: string]: unknown;
}

export const resumeApi = {
  async validateHash(fileHash: string): Promise<{ isDuplicate?: boolean; [k: string]: unknown }> {
    const res = await api().post(Api.resumeValidateHash, { fileHash });
    return res.data.data;
  },

  async generatePresignedUrl(params: {
    fileName: string;
    fileSize: number;
    fileHash: string;
  }): Promise<PresignedUrlData> {
    const res = await api().post(Api.resumeUploadUrl, params);
    return res.data.data;
  },

  async list(): Promise<{ resumes: Resume[]; maxAllowed: number }> {
    const res = await api().get(Api.resumeList);
    const data = res.data.data;
    return {
      resumes: (data.resumes as any[]).map(parseResume),
      maxAllowed: data.maxAllowed,
    };
  },

  async detail(resumeId: string): Promise<Resume> {
    const res = await api().get(Api.resumeDetail, { params: { resumeId } });
    return parseResume(res.data.data.resume);
  },

  async delete(resumeId: string): Promise<void> {
    await api().delete(Api.resumeDetail, { params: { resumeId } });
  },

  async setActive(resumeId: string): Promise<void> {
    await api().put(Api.resumeSetActive, { resumeId });
  },

  async process(resumeId: string): Promise<Record<string, unknown>> {
    const res = await api().post(Api.resumeProcess, { resumeId });
    return res.data.data;
  },

  async updateParsedData(resumeId: string, updates: Record<string, unknown>): Promise<Resume> {
    const res = await api().put(Api.resumeDetail, { updates }, { params: { resumeId } });
    return parseResume(res.data.data.resume);
  },

  /** Raw PUT of file bytes to the S3 presigned URL (no auth header). */
  async uploadToS3(uploadUrl: string, bytes: ArrayBuffer): Promise<void> {
    await axios.put(uploadUrl, bytes, {
      headers: { 'Content-Type': 'application/pdf' },
      timeout: 120_000,
      transformRequest: [(d) => d],
    });
  },
};
