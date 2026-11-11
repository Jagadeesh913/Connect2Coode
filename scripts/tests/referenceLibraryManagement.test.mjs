import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');
const readServiceSources = (directory = 'src/services') => fs
  .readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? readServiceSources(path) : entry.name.endsWith('.ts') ? [read(path)] : [];
  })
  .join('\n');

describe('reference library management contract', () => {
  it('registers the list, group, save/update, and encoded hard-delete endpoints centrally', () => {
    const endpoints = read('src/core/api/endpoints.ts');
    assert.match(endpoints, /BASE:\s*'\/referenceLibrary'/);
    assert.match(endpoints, /GROUP_CODES:\s*'\/referenceLibrary\/refGroupCode\/list'/);
    assert.match(endpoints, /GROUP:\s*\(refGroupCode: string\)/);
    assert.match(endpoints, /ITEM:\s*\(refGroupCode: string, refCode: string\)/);
    assert.match(endpoints, /encodeURIComponent\(refGroupCode\)/);
    assert.match(endpoints, /encodeURIComponent\(refCode\)/);
  });

  it('normalizes group lookups and rejects malformed successful reference payloads', () => {
    const service = read('src/services/referenceService.ts');
    assert.match(service, /const normalizedGroupCode = normalizeGroupCode\(refGroupCode\)/);
    assert.match(service, /if \(!normalizedGroupCode\)/);
    assert.match(service, /Number\.isFinite\(item\.id\)/);
    assert.match(service, /normalizeGroupCode\(item\.refGroupCode\) === expectedGroupCode/);
    assert.match(service, /typeof item\.isActive === 'boolean'/);
    assert.match(service, /item\.logoUrl === undefined \|\| item\.logoUrl === null \|\| typeof item\.logoUrl === 'string'/);
    assert.match(service, /response\.data\.some\(\(item\) => !isReferenceItem\(item, normalizedGroupCode\)\)/);
  });

  it('renders API-owned QPF logo metadata without a duplicate reference-library request', async () => {
    const types = read('src/core/types/domain.ts');
    const table = read('src/features/problems/components/CodingQuestionTable.tsx');
    assert.match(types, /platformLogoUrl\?: string \| null/);
    assert.doesNotMatch(table, /useReferenceGroup\('QPF'\)/);
    assert.match(table, /getSafeRemoteImageUrl\(logoUrl\)/);
    assert.match(table, /question\.platformLogoUrl/);
    assert.doesNotMatch(table, /<span className="truncate max-w-\[130px\]">\{label\}<\/span>/);
    assert.match(table, /PlatformCircleBadge/);
    assert.match(table, /<CompanyCircleBadge/);
  });

  it('keeps reads shared while isolating mutations in an admin service', () => {
    const sharedService = read('src/services/referenceService.ts');
    const adminService = read('src/services/admin/adminReferenceService.ts');
    assert.match(sharedService, /getGroupCodes/);
    assert.match(sharedService, /getByGroupCode/);
    assert.doesNotMatch(sharedService, /hardDelete|\.post\(/);
    assert.match(adminService, /async save/);
    assert.match(adminService, /async hardDelete/);
    assert.doesNotMatch(adminService, /async create|async update|\{ data: \{\} \}/);
  });

  it('accepts both API-envelope and bodyless 204 hard-delete success responses', () => {
    const adminService = read('src/services/admin/adminReferenceService.ts');
    assert.match(adminService, /ApiResponse<null> \| undefined/);
    assert.match(adminService, /response !== undefined && response\.data !== null/);
    assert.match(adminService, /Promise<void>/);
    assert.match(adminService, /Number\.isSafeInteger\(item\.id\)/);
    assert.match(adminService, /item\.refCode\.trim\(\)\.length === 0/);
  });

  it('keeps every admin MCQ mutation out of the user-facing MCQ service', () => {
    const endpoints = read('src/core/api/endpoints.ts');
    const sharedService = read('src/services/mcqService.ts');
    const adminService = read('src/services/admin/adminMcqService.ts');
    assert.match(endpoints, /ADMIN_SAVE:\s*'\/admin\/mcq'/);
    assert.doesNotMatch(endpoints, /ADMIN_CREATE/);
    assert.doesNotMatch(read('src/services/admin/adminLearningSheetService.ts'), /createSheet|createSection/);
    assert.match(endpoints, /ADMIN_SECTION_SAVE:\s*'\/admin\/learningSheet\/section'/);
    assert.match(endpoints, /ADMIN_QUESTION_SAVE:\s*'\/admin\/learningSheet\/question'/);
    assert.doesNotMatch(sharedService, /ADMIN_SAVE|ADMIN_DELETE|createMcq|updateMcq|deleteMcq/);
    assert.match(adminService, /API_ENDPOINTS\.MCQ\.ADMIN_SAVE/);
    assert.match(adminService, /API_ENDPOINTS\.MCQ\.ADMIN_DELETE/);
    assert.match(adminService, /async saveMcq/);
    assert.doesNotMatch(adminService, /async createMcq|async updateMcq/);
  });

  it('never fabricates reference records or legacy numeric IDs when taxonomy reads fail', () => {
    const aptitude = read('src/features/aptitude/pages/AptitudePrep.tsx');
    const dashboard = read('src/features/admin/pages/AdminDashboard.tsx');
    assert.doesNotMatch(aptitude, /DEFAULT_DIFFICULTIES/);
    assert.doesNotMatch(aptitude, /\{ id: [1-4], refCode: '(?:BASIC|EASY|MEDIUM|HARD)'/);
    assert.match(aptitude, /difficultyRefName \|\| question\.difficultyRefCode \|\| 'Unspecified'/);
    assert.match(aptitude, /Difficulty reference data is unavailable/);
    assert.doesNotMatch(dashboard, /referenceService/);
    assert.doesNotMatch(dashboard, /\?\? [234]/);
    assert.match(dashboard, /useReferenceGroup\('DIFF'\)/);
  });

  it('routes all component-level reference group reads through the shared Redux hook', () => {
    const adminPage = read('src/features/admin/pages/AdminReferences.tsx');
    const dashboard = read('src/features/admin/pages/AdminDashboard.tsx');
    assert.match(adminPage, /useReferenceGroup\(selectedGroup, Boolean\(selectedGroup\)\)/);
    assert.doesNotMatch(adminPage, /referenceService\.getByGroupCode/);
    assert.match(dashboard, /useReferenceGroup\('DIFF'\)/);
    assert.doesNotMatch(dashboard, /referenceService\.getByGroupCode/);
  });

  it('uses API-owned exam section and question type records instead of legacy numeric IDs', () => {
    const modal = read('src/features/admin/components/companies/ExamSectionFormModal.tsx');
    const service = read('src/services/admin/adminCompanyService.ts');
    assert.match(modal, /useReferenceGroup\('EXAM SECTION TYPE', isOpen\)/);
    assert.match(modal, /useReferenceGroup\('QUESTION TYPE', isOpen\)/);
    assert.doesNotMatch(modal, /value=\{?(?:87|88|89|99|100)\}?/);
    assert.doesNotMatch(service, /sectionTypeId \|\| payload\.sectionType \|\| 100/);
    assert.match(service, /Section classification must be selected from the reference library/);
    assert.doesNotMatch(modal, /firstSectionTypeId/);
    assert.match(modal, /disabled=\{submitting \|\| sectionTypesLoading \|\| questionTypesLoading \|\| sectionTypes\.length === 0\}/);
  });

  it('discards superseded reference-group catalog responses', () => {
    const page = read('src/features/admin/pages/AdminReferences.tsx');
    assert.match(page, /groupsRequestGenerationRef/);
    assert.match(page, /requestGeneration !== groupsRequestGenerationRef\.current/);
  });

  it('keeps every service payload free of access JWT fields and centralizes authentication', () => {
    const services = readServiceSources();
    const institutionService = read('src/services/admin/adminInstitutionService.ts');
    const institutionTypes = read('src/core/types/domain.ts');
    assert.doesNotMatch(services, /\b(?:jwtToken|jwttoken|jwt_token)\b/);
    assert.doesNotMatch(services, /getAccessToken\s*\(/);
    assert.doesNotMatch(services, /\.data\s*(?:\|\||\?\?)\s*(?:res|response|result)\b/);
    assert.doesNotMatch(institutionService, /params\.(?:institutionType|isActive)/);
    const filterType = institutionTypes.match(/interface InstitutionFilterParams \{([\s\S]*?)\n\}/)?.[1] || '';
    assert.doesNotMatch(filterType, /institutionType|isActive/);
  });

  it('uses authoritative create and update payloads from the verified backend contract', () => {
    const types = read('src/core/types/domain.ts');
    const page = read('src/features/admin/pages/AdminReferences.tsx');
    assert.match(types, /interface CreateReferenceItemRequest[\s\S]*refGroupName: string/);
    assert.match(types, /interface UpdateReferenceItemRequest[\s\S]*id: number/);
    assert.match(types, /interface UpdateReferenceItemRequest[\s\S]*refGroupName: string/);
    assert.match(types, /interface CreateReferenceItemRequest[\s\S]*logoUrl\?: string \| null/);
    assert.match(types, /interface UpdateReferenceItemRequest[\s\S]*logoUrl\?: string \| null/);
    assert.match(page, /if \(!refGroupName\)/);
    assert.equal((page.match(/await adminReferenceService\.save\(payload\)/g) || []).length, 2);
  });

  it('requires an explicit admin confirmation before hard deletion', () => {
    const page = read('src/features/admin/pages/AdminReferences.tsx');
    assert.match(page, /<ConfirmDialog/);
    assert.match(page, /title="Permanently delete this reference\?"/);
    assert.match(page, /confirmLabel="Permanently Delete"/);
    assert.match(page, /await adminReferenceService\.hardDelete/);
    assert.match(page, /This is a hard delete/);
  });

  it('exposes reference management only inside the guarded admin route and navigation', () => {
    const routes = read('src/routes/appRoutes.tsx');
    const sidebar = read('src/features/admin/components/AdminSidebar.tsx');
    assert.match(routes, /element: <AdminRoute \/>[\s\S]*path: 'references'/);
    assert.equal((routes.match(/path: 'references'/g) || []).length, 1);
    assert.match(sidebar, /to: '\/admin\/references'/);
    assert.doesNotMatch(routes, /path: '\/references'/);
  });
});
