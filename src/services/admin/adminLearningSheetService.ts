import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import type { ApiResponse } from '../../core/types/api';
import type {
  CreateDsaSheetPayload,
  CreateDsaSheetSectionPayload,
  DsaSheet,
  DsaSheetQuestionLink,
  DsaSheetSection,
  LinkDsaSheetQuestionPayload,
} from '../../features/dsaSheet/types';

export const adminLearningSheetService = {
  createSheet(payload: CreateDsaSheetPayload): Promise<ApiResponse<DsaSheet>> {
    return apiClient.post(API_ENDPOINTS.LEARNING_SHEET.ADMIN_CREATE, payload);
  },

  createSection(payload: CreateDsaSheetSectionPayload): Promise<ApiResponse<DsaSheetSection>> {
    return apiClient.post(API_ENDPOINTS.LEARNING_SHEET.ADMIN_SECTION_CREATE, payload);
  },

  linkQuestion(payload: LinkDsaSheetQuestionPayload): Promise<ApiResponse<DsaSheetQuestionLink>> {
    return apiClient.post(API_ENDPOINTS.LEARNING_SHEET.ADMIN_QUESTION_LINK, payload);
  },

  deleteSection(sectionId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(API_ENDPOINTS.LEARNING_SHEET.ADMIN_SECTION_DELETE(sectionId), { data: {} });
  },

  unlinkQuestion(sectionId: number, linkId: number): Promise<ApiResponse<null>> {
    return apiClient.delete(
      API_ENDPOINTS.LEARNING_SHEET.ADMIN_QUESTION_DELETE(sectionId, linkId),
      { data: {} }
    );
  },
};
