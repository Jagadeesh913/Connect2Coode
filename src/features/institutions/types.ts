import type {
  Institution,
  InstitutionOptionDTO,
  InstitutionFilterParams,
  CreateInstitutionRequest,
  UpdateInstitutionRequest,
  UpdateInstitutionStatusRequest,
  InstitutionType,
} from '../../core/types/domain';

export type {
  Institution,
  InstitutionOptionDTO,
  InstitutionFilterParams,
  CreateInstitutionRequest,
  UpdateInstitutionRequest,
  UpdateInstitutionStatusRequest,
  InstitutionType,
};

export interface InstitutionFormData {
  id?: number | null;
  aisheCode: string;
  name: string;
  institutionType: InstitutionType;
  universityId?: number | null;
  state: string;
  district: string;
  website?: string;
  yearOfEstablishment?: number | string;
  isActive: boolean;
}
