import { api } from '@/lib/apiClient';
import { Api } from '@/config/env';
import { parseFeedbackReport, type FeedbackReport } from '@/types/feedback';

export const feedbackApi = {
  async getReport(sessionId: string): Promise<FeedbackReport | null> {
    const res = await api().get(`${Api.feedbackReport}/${sessionId}`);
    if (res.status === 200) {
      const data = res.data.feedback;
      if (data == null) return null;
      return parseFeedbackReport(data);
    }
    return null;
  },
};
