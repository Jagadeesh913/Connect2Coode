import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type {
  DsaSheet,
  DsaSheetQuestionLink,
  DsaSheetSection,
  LinkDsaSheetQuestionPayload,
  SaveDsaSheetPayload,
  SaveDsaSheetSectionPayload,
} from '../../features/dsaSheet/types';

export const adminLearningSheetService = {
  saveSheet(payload: SaveDsaSheetPayload): Promise<ApiResponse<DsaSheet>> {
    return apiClient.post(API_ENDPOINTS.LEARNING_SHEET.ADMIN_SAVE, payload);
  },

  saveSection(payload: SaveDsaSheetSectionPayload): Promise<ApiResponse<DsaSheetSection>> {
    return apiClient.post(API_ENDPOINTS.LEARNING_SHEET.ADMIN_SECTION_SAVE, payload);
  },

  linkQuestion(payload: LinkDsaSheetQuestionPayload): Promise<ApiResponse<DsaSheetQuestionLink>> {
    return apiClient.post(API_ENDPOINTS.LEARNING_SHEET.ADMIN_QUESTION_SAVE, payload);
  },

  deleteSection(sectionId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(API_ENDPOINTS.LEARNING_SHEET.ADMIN_SECTION_DELETE(sectionId));
  },

  unlinkQuestion(sectionId: number, linkId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(
      API_ENDPOINTS.LEARNING_SHEET.ADMIN_QUESTION_DELETE(sectionId, linkId)
    );
  },
};
