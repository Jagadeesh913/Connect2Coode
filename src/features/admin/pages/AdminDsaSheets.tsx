import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import {
  BookOpenCheck,
  ChevronRight,
  Layers3,
  Link2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { getActionableErrorMessage } from '../../../core/validation/serverErrorMapper';
import { adminLearningSheetService } from '../../../services/admin/adminLearningSheetService';
import { adminQuestionService, type QuestionListItem } from '../../../services/admin/adminQuestionService';
import { learningSheetService } from '../../../services/learningSheetService';
import { Button } from '../../../shared/components/ui/Button';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { AdminBadge } from '../components/AdminBadge';
import { AdminCard } from '../components/AdminCard';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminErrorState } from '../components/AdminErrorState';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import type { DsaSheet, DsaSheetQuestionLink, DsaSheetSection } from '../../dsaSheet/types';

const sheetSchema = z.object({
  sheetCode: z.string().trim().min(2, 'Sheet code is required').max(60),
  sheetName: z.string().trim().min(3, 'Sheet name is required').max(120),
  description: z.string().trim().min(3, 'Description is required').max(500),
  isActive: z.boolean(),
});
const sectionSchema = z.object({
  sectionName: z.string().trim().min(2, 'Section name is required').max(120),
  displayOrder: z.number().int().min(1, 'Order must be at least 1'),
  isActive: z.boolean(),
});
const linkSchema = z.object({
  questionId: z.number().int().positive('Select a question'),
  displayOrder: z.number().int().min(1, 'Order must be at least 1'),
  isActive: z.boolean(),
});

type SheetForm = z.infer<typeof sheetSchema>;
type SectionForm = z.infer<typeof sectionSchema>;
type LinkForm = z.infer<typeof linkSchema>;

const fieldClass = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';
const errorClass = 'mt-1 text-xs text-rose-600 dark:text-rose-400';

const AdminListSkeleton: React.FC<{ count?: number; compact?: boolean }> = ({ count = 3, compact = false }) => (
  <div aria-label="Loading records" role="status" className="space-y-2 p-2">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={`rounded-xl border border-slate-200/70 p-3 dark:border-slate-800 ${compact ? 'space-y-2' : 'flex items-center gap-3'}`}>
        {!compact && <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />}
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export const AdminDsaSheets: React.FC = () => {
  const [sheets, setSheets] = useState<DsaSheet[]>([]);
  const [sections, setSections] = useState<DsaSheetSection[]>([]);
  const [links, setLinks] = useState<DsaSheetQuestionLink[]>([]);
  const [questionOptions, setQuestionOptions] = useState<QuestionListItem[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [loadingQuestionOptions, setLoadingQuestionOptions] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<DsaSheetSection | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<DsaSheetQuestionLink | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const selectedSheetIdRef = useRef<number | null>(null);
  const selectedSectionIdRef = useRef<number | null>(null);
  const sheetsAbortRef = useRef<AbortController | null>(null);
  const sectionsAbortRef = useRef<AbortController | null>(null);
  const linksAbortRef = useRef<AbortController | null>(null);
  const optionsAbortRef = useRef<AbortController | null>(null);

  const sheetForm = useForm<SheetForm>({ resolver: zodResolver(sheetSchema), defaultValues: { sheetCode: '', sheetName: '', description: '', isActive: true } });
  const sectionForm = useForm<SectionForm>({ resolver: zodResolver(sectionSchema), defaultValues: { sectionName: '', displayOrder: 1, isActive: true } });
  const linkForm = useForm<LinkForm>({ resolver: zodResolver(linkSchema), defaultValues: { questionId: 0, displayOrder: 1, isActive: true } });

  const loadSheets = useCallback(async () => {
    sheetsAbortRef.current?.abort();
    const controller = new AbortController();
    sheetsAbortRef.current = controller;
    setLoading(true);
    setSheetError(null);
    try {
      const result = await learningSheetService.getSheets(controller.signal);
      if (controller.signal.aborted) return;
      setSheets(result);
      const current = selectedSheetIdRef.current;
      const next = current && result.some((sheet) => sheet.id === current) ? current : result[0]?.id ?? null;
      if (next !== current) setLoadingSections(next !== null);
      selectedSheetIdRef.current = next;
      setSelectedSheetId(next);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setSheetError(getActionableErrorMessage(requestError, 'Unable to load DSA sheets.'));
    } finally {
      if (sheetsAbortRef.current === controller) setLoading(false);
    }
  }, []);

  const loadSections = useCallback(async (sheetId: number) => {
    sectionsAbortRef.current?.abort();
    const controller = new AbortController();
    sectionsAbortRef.current = controller;
    setLoadingSections(true);
    setSectionsError(null);
    try {
      const result = await learningSheetService.getSections(sheetId, controller.signal);
      if (controller.signal.aborted) return;
      setSections(result);
      const current = selectedSectionIdRef.current;
      const next = current && result.some((section) => section.id === current) ? current : result[0]?.id ?? null;
      if (next !== current) setLoadingLinks(next !== null);
      selectedSectionIdRef.current = next;
      setSelectedSectionId(next);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setSections([]);
      selectedSectionIdRef.current = null;
      setSelectedSectionId(null);
      setSectionsError(getActionableErrorMessage(requestError, 'Unable to load sheet sections.'));
    } finally {
      if (sectionsAbortRef.current === controller) setLoadingSections(false);
    }
  }, []);

  const loadLinks = useCallback(async (sectionId: number) => {
    linksAbortRef.current?.abort();
    const controller = new AbortController();
    linksAbortRef.current = controller;
    setLoadingLinks(true);
    setLinksError(null);
    try {
      const result = await learningSheetService.getSectionQuestions(sectionId, controller.signal);
      if (controller.signal.aborted) return;
      setLinks(result);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setLinks([]);
      setLinksError(getActionableErrorMessage(requestError, 'Unable to load linked questions.'));
    } finally {
      if (linksAbortRef.current === controller) setLoadingLinks(false);
    }
  }, []);

  useEffect(() => { void loadSheets(); }, [loadSheets]);
  useEffect(() => {
    sectionsAbortRef.current?.abort();
    linksAbortRef.current?.abort();
    setLinks([]);
    setSections([]);
    selectedSectionIdRef.current = null;
    setSelectedSectionId(null);
    if (selectedSheetId) void loadSections(selectedSheetId);
    else {
      selectedSheetIdRef.current = null;
      setSections([]);
      setSelectedSectionId(null);
    }
  }, [loadSections, selectedSheetId]);
  useEffect(() => {
    linksAbortRef.current?.abort();
    setLinks([]);
    if (selectedSectionId) void loadLinks(selectedSectionId);
    else setLinks([]);
  }, [loadLinks, selectedSectionId]);

  useEffect(() => () => {
    sheetsAbortRef.current?.abort();
    sectionsAbortRef.current?.abort();
    linksAbortRef.current?.abort();
    optionsAbortRef.current?.abort();
  }, []);

  const loadQuestionOptions = useCallback(async (query = '') => {
    optionsAbortRef.current?.abort();
    const controller = new AbortController();
    optionsAbortRef.current = controller;
    setLoadingQuestionOptions(true);
    setQuestionOptions([]);
    try {
      const response = await adminQuestionService.getQuestions({
        level: null,
        companies: null,
        topic: null,
        searchText: query.trim() || null,
        pageRequest: { pageNumber: 0, pageSize: 50, sortBy: 'id', sortDirection: 'ASC' },
      }, controller.signal);
      if (controller.signal.aborted) return;
      setQuestionOptions(response.data.content);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      toast.error(getActionableErrorMessage(requestError, 'Unable to load the question bank.'));
    } finally {
      if (optionsAbortRef.current === controller) setLoadingQuestionOptions(false);
    }
  }, []);

  useEffect(() => {
    if (linkModalOpen) void loadQuestionOptions();
  }, [linkModalOpen, loadQuestionOptions]);

  const selectedSheet = sheets.find((sheet) => sheet.id === selectedSheetId) ?? null;
  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? null;
  const linkedQuestionIds = useMemo(() => new Set(links.map((link) => link.question.id)), [links]);
  const availableQuestionOptions = questionOptions.filter((question) => !linkedQuestionIds.has(question.id));

  const selectSheet = (sheetId: number) => {
    if (sheetId === selectedSheetId) return;
    sectionsAbortRef.current?.abort();
    linksAbortRef.current?.abort();
    setSections([]);
    setLinks([]);
    setSelectedSectionId(null);
    setLoadingSections(true);
    setLoadingLinks(false);
    selectedSheetIdRef.current = sheetId;
    selectedSectionIdRef.current = null;
    setSelectedSheetId(sheetId);
  };

  const selectSection = (sectionId: number) => {
    if (sectionId === selectedSectionId) return;
    linksAbortRef.current?.abort();
    setLinks([]);
    setLoadingLinks(true);
    selectedSectionIdRef.current = sectionId;
    setSelectedSectionId(sectionId);
  };

  const createSheet = sheetForm.handleSubmit(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await adminLearningSheetService.createSheet(values);
      toast.success(response.message || 'DSA sheet created');
      sheetForm.reset();
      setSheetModalOpen(false);
      await loadSheets();
      if (response.data?.id) {
        selectedSheetIdRef.current = response.data.id;
        setLoadingSections(true);
        setSelectedSheetId(response.data.id);
      }
    } catch (requestError) {
      toast.error(getActionableErrorMessage(requestError, 'Unable to create DSA sheet.'));
    } finally { submittingRef.current = false; setSubmitting(false); }
  });

  const createSection = sectionForm.handleSubmit(async (values) => {
    if (!selectedSheetId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await adminLearningSheetService.createSection({ ...values, sheetId: selectedSheetId, parentSectionId: null });
      toast.success(response.message || 'Section created');
      sectionForm.reset({ sectionName: '', displayOrder: sections.length + 1, isActive: true });
      setSectionModalOpen(false);
      await loadSections(selectedSheetId);
      if (response.data?.id) {
        selectedSectionIdRef.current = response.data.id;
        setLoadingLinks(true);
        setSelectedSectionId(response.data.id);
      }
    } catch (requestError) {
      toast.error(getActionableErrorMessage(requestError, 'Unable to create section.'));
    } finally { submittingRef.current = false; setSubmitting(false); }
  });

  const linkQuestion = linkForm.handleSubmit(async (values) => {
    if (!selectedSectionId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await adminLearningSheetService.linkQuestion({ id: null, sectionId: selectedSectionId, question: { id: values.questionId }, displayOrder: values.displayOrder, isActive: values.isActive });
      toast.success(response.message || 'Question linked');
      linkForm.reset({ questionId: 0, displayOrder: links.length + 1, isActive: true });
      setLinkModalOpen(false);
      await loadLinks(selectedSectionId);
    } catch (requestError) {
      toast.error(getActionableErrorMessage(requestError, 'Unable to link question.'));
    } finally { submittingRef.current = false; setSubmitting(false); }
  });

  const deleteSection = async () => {
    if (!sectionToDelete || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await adminLearningSheetService.deleteSection(sectionToDelete.id);
      toast.success(response.message || 'Section deleted');
      setSectionToDelete(null);
      if (selectedSheetId) await loadSections(selectedSheetId);
    } catch (requestError) {
      toast.error(getActionableErrorMessage(requestError, 'Unable to delete section.'));
    } finally { submittingRef.current = false; setSubmitting(false); }
  };

  const unlinkQuestion = async () => {
    if (!linkToDelete || !selectedSectionId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await adminLearningSheetService.unlinkQuestion(selectedSectionId, linkToDelete.id);
      toast.success(response.message || 'Question removed from section');
      setLinkToDelete(null);
      await loadLinks(selectedSectionId);
    } catch (requestError) {
      toast.error(getActionableErrorMessage(requestError, 'Unable to remove linked question.'));
    } finally { submittingRef.current = false; setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="DSA Sheets"
        description="Build ordered DSA learning paths from the existing problem bank."
        badge={<AdminBadge variant="primary">Learning Sheet API</AdminBadge>}
        actions={<Button size="sm" onClick={() => setSheetModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>New sheet</Button>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_0.9fr_1.4fr] gap-5 items-start">
        <AdminCard title="Sheets" subtitle={`${sheets.length} configured`} icon={<BookOpenCheck className="w-4 h-4" />} bodyClassName="p-2">
          {loading ? <AdminListSkeleton count={4} /> : sheetError ? <div className="p-2"><AdminErrorState message={sheetError} onRetry={loadSheets} /></div> : sheets.length === 0 ? <AdminEmptyState title="No DSA sheets" description="Create the first learning sheet to begin." /> : (
            <div className="space-y-1">
              {sheets.map((sheet) => (
                <button key={sheet.id} type="button" aria-pressed={selectedSheetId === sheet.id} onClick={() => selectSheet(sheet.id)} className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors ${selectedSheetId === sheet.id ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'}`}>
                  <div className="min-w-0"><p className="text-sm font-bold text-slate-900 dark:text-white truncate">{sheet.sheetName}</p><p className="text-[11px] font-mono text-slate-500 truncate">{sheet.sheetCode}</p></div>
                  <div className="flex items-center gap-2"><AdminBadge size="sm" variant={sheet.isActive ? 'success' : 'danger'}>{sheet.isActive ? 'Active' : 'Inactive'}</AdminBadge><ChevronRight className="w-4 h-4 text-slate-400" /></div>
                </button>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard title="Sections" subtitle={selectedSheet?.sheetName || 'Select a sheet'} icon={<Layers3 className="w-4 h-4" />} action={<Button size="sm" variant="outline" disabled={!selectedSheetId} onClick={() => { sectionForm.reset({ sectionName: '', displayOrder: sections.length + 1, isActive: true }); setSectionModalOpen(true); }} leftIcon={<Plus className="w-3.5 h-3.5" />}>Add</Button>} bodyClassName="p-2">
          {loadingSections ? <AdminListSkeleton /> : sectionsError ? <div className="p-2"><AdminErrorState message={sectionsError} onRetry={() => selectedSheetId && void loadSections(selectedSheetId)} /></div> : sections.length === 0 ? <AdminEmptyState title="No sections" description="Add an ordered top-level section." /> : (
            <div className="space-y-1">
              {sections.map((section) => (
                <div key={section.id} className={`group flex items-center gap-2 rounded-xl border ${selectedSectionId === section.id ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  <button type="button" aria-pressed={selectedSectionId === section.id} onClick={() => selectSection(section.id)} className="min-w-0 flex-1 flex items-center gap-3 px-3 py-3 text-left">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">{section.displayOrder}</span>
                    <div className="min-w-0"><p className="text-sm font-bold text-slate-900 dark:text-white truncate">{section.sectionName}</p><p className="text-[11px] text-slate-500">{section.isActive ? 'Visible to users' : 'Inactive'}</p></div>
                  </button>
                  <button type="button" aria-label={`Delete ${section.sectionName}`} onClick={() => setSectionToDelete(section)} className="p-2 mr-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard title="Linked questions" subtitle={selectedSection?.sectionName || 'Select a section'} icon={<Link2 className="w-4 h-4" />} action={<Button size="sm" disabled={!selectedSectionId} onClick={() => { linkForm.reset({ questionId: 0, displayOrder: links.length + 1, isActive: true }); setLinkModalOpen(true); }} leftIcon={<Plus className="w-3.5 h-3.5" />}>Link question</Button>} bodyClassName="p-0">
          {loadingLinks ? <AdminListSkeleton count={4} compact /> : linksError ? <div className="p-3"><AdminErrorState message={linksError} onRetry={() => selectedSectionId && void loadLinks(selectedSectionId)} /></div> : links.length === 0 ? <div className="p-3"><AdminEmptyState title="No linked questions" description="Choose problems from the existing bank." /></div> : (
            <ol className="divide-y divide-slate-100 dark:divide-slate-800">
              {links.map((link) => (
                <li key={link.id} className="flex items-start gap-3 p-4">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">{link.displayOrder}</span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-slate-900 dark:text-white">{link.question.title}</p><AdminBadge size="sm" variant={link.isActive ? 'success' : 'danger'}>{link.isActive ? 'Active' : 'Inactive'}</AdminBadge></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{link.question.description}</p><p className="mt-2 text-[11px] text-slate-400">#{link.question.id} · {link.question.difficultyName} · {link.question.topicName}</p></div>
                  <button type="button" aria-label={`Remove ${link.question.title}`} onClick={() => setLinkToDelete(link)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>
      </div>

      <AdminModal isOpen={sheetModalOpen} onClose={() => setSheetModalOpen(false)} title="Create DSA sheet" subtitle="Published through the learning sheet API" icon={<BookOpenCheck className="w-5 h-5" />} footer={<><Button variant="ghost" onClick={() => setSheetModalOpen(false)}>Cancel</Button><Button isLoading={submitting} onClick={createSheet}>Create sheet</Button></>}>
        <form onSubmit={createSheet} className="space-y-4">
          <div><label className={labelClass}>Sheet code</label><input {...sheetForm.register('sheetCode')} className={fieldClass} placeholder="JAVA-DSA-001" />{sheetForm.formState.errors.sheetCode && <p className={errorClass}>{sheetForm.formState.errors.sheetCode.message}</p>}</div>
          <div><label className={labelClass}>Sheet name</label><input {...sheetForm.register('sheetName')} className={fieldClass} placeholder="Java DSA Preparation" />{sheetForm.formState.errors.sheetName && <p className={errorClass}>{sheetForm.formState.errors.sheetName.message}</p>}</div>
          <div><label className={labelClass}>Description</label><textarea {...sheetForm.register('description')} rows={4} className={fieldClass} placeholder="What this sheet helps students prepare for" />{sheetForm.formState.errors.description && <p className={errorClass}>{sheetForm.formState.errors.description.message}</p>}</div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" {...sheetForm.register('isActive')} className="w-4 h-4" /> Active and visible</label>
        </form>
      </AdminModal>

      <AdminModal isOpen={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title="Add section" subtitle={selectedSheet?.sheetName} icon={<Layers3 className="w-5 h-5" />} footer={<><Button variant="ghost" onClick={() => setSectionModalOpen(false)}>Cancel</Button><Button isLoading={submitting} onClick={createSection}>Create section</Button></>}>
        <form onSubmit={createSection} className="space-y-4"><div><label className={labelClass}>Section name</label><input {...sectionForm.register('sectionName')} className={fieldClass} placeholder="Arrays" />{sectionForm.formState.errors.sectionName && <p className={errorClass}>{sectionForm.formState.errors.sectionName.message}</p>}</div><div><label className={labelClass}>Display order</label><input type="number" {...sectionForm.register('displayOrder', { valueAsNumber: true })} className={fieldClass} />{sectionForm.formState.errors.displayOrder && <p className={errorClass}>{sectionForm.formState.errors.displayOrder.message}</p>}</div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" {...sectionForm.register('isActive')} className="w-4 h-4" /> Active and visible</label></form>
      </AdminModal>

      <AdminModal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Link a question" subtitle={selectedSection?.sectionName} icon={<Link2 className="w-5 h-5" />} maxWidth="2xl" footer={<><Button variant="ghost" onClick={() => setLinkModalOpen(false)}>Cancel</Button><Button isLoading={submitting} onClick={linkQuestion}>Link question</Button></>}>
        <form onSubmit={linkQuestion} className="space-y-4">
          <div><label className={labelClass}>Search question bank</label><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} className={`${fieldClass} pl-9`} placeholder="Title, topic or difficulty" /></div><Button type="button" variant="outline" isLoading={loadingQuestionOptions} onClick={() => void loadQuestionOptions(questionSearch)}>Search</Button></div></div>
          <div><label className={labelClass}>Question</label>{loadingQuestionOptions ? <Skeleton className="h-11 w-full rounded-xl" /> : <select {...linkForm.register('questionId', { valueAsNumber: true })} className={fieldClass}><option value={0}>Select a problem</option>{availableQuestionOptions.map((question) => <option key={question.id} value={question.id}>#{question.id} · {question.title} · {question.difficultyName || 'Unknown'}</option>)}</select>}{linkForm.formState.errors.questionId && <p className={errorClass}>{linkForm.formState.errors.questionId.message}</p>}</div>
          <div><label className={labelClass}>Display order</label><input type="number" {...linkForm.register('displayOrder', { valueAsNumber: true })} className={fieldClass} />{linkForm.formState.errors.displayOrder && <p className={errorClass}>{linkForm.formState.errors.displayOrder.message}</p>}</div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" {...linkForm.register('isActive')} className="w-4 h-4" /> Active and visible</label>
        </form>
      </AdminModal>

      <ConfirmDialog isOpen={Boolean(sectionToDelete)} onClose={() => setSectionToDelete(null)} onConfirm={deleteSection} submitting={submitting} title="Delete DSA section?" description={`Delete “${sectionToDelete?.sectionName || 'this section'}”? Linked question associations may also be removed by the backend.`} confirmText="Delete section" />
      <ConfirmDialog isOpen={Boolean(linkToDelete)} onClose={() => setLinkToDelete(null)} onConfirm={unlinkQuestion} submitting={submitting} title="Remove linked question?" description={`Remove “${linkToDelete?.question.title || 'this question'}” from the selected section? The problem itself will remain in the question bank.`} confirmText="Remove question" />
    </div>
  );
};

export default AdminDsaSheets;
