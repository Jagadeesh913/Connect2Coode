import type { Company } from '../../../core/types/domain';

export type CompanyExamRequestIdentity =
  | { status: 'waiting' }
  | { status: 'invalid'; error: string }
  | { status: 'ready'; companyId: number };

export function resolveCompanyExamRequestIdentity(
  company: Pick<Company, 'id'> | null
): CompanyExamRequestIdentity {
  if (!company) return { status: 'waiting' };

  const companyId = Number(company.id);
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    return {
      status: 'invalid',
      error: 'Company information is missing a valid numeric ID.',
    };
  }

  return { status: 'ready', companyId };
}
