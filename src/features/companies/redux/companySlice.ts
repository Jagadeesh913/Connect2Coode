import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companyService } from '../../../services/companyService';
import { isRequestCanceled } from '../../../core/api/apiClient';
import type { Company } from '../../../core/types/domain';

const COMPANY_LIST_CACHE_TTL_MS = 5 * 60_000;
const COMPANY_DETAIL_CACHE_TTL_MS = 5 * 60_000;

export type CompanyItem = Company;

export interface CompanyListCacheEntry {
  companies: CompanyItem[];
  fetchedAt: number;
}

interface CompanyDetailCacheEntry {
  company: CompanyItem;
  fetchedAt: number;
}

export interface CompanyState {
  companies: CompanyItem[];
  selectedCompany: CompanyItem | null;
  loading: boolean;
  listLoading: boolean;
  detailsLoading: boolean;
  error: string | null;
  detailError: string | null;
  companiesRequestKey: string | null;
  companyDetailRequestKey: string | null;
  companiesRequestId: string | null;
  companyDetailRequestId: string | null;
  listCache: Record<string, CompanyListCacheEntry>;
  detailCache: Record<string, CompanyDetailCacheEntry>;
}

const initialState: CompanyState = {
  companies: [],
  selectedCompany: null,
  loading: false,
  listLoading: false,
  detailsLoading: false,
  error: null,
  detailError: null,
  companiesRequestKey: null,
  companyDetailRequestKey: null,
  companiesRequestId: null,
  companyDetailRequestId: null,
  listCache: {},
  detailCache: {},
};

const getCompanyListKey = (search?: string): string => (search || '').trim().toLowerCase();

const getCompanyDetailKey = (slug: string): string => slug.trim().toLowerCase();

let activeCompaniesSignal: AbortSignal | null = null;
let activeCompanyDetailSignal: AbortSignal | null = null;

export const fetchCompanies = createAsyncThunk(
  'companies/fetchList',
  async (search: string | undefined = undefined, { rejectWithValue, getState, signal }) => {
    activeCompaniesSignal = signal;
    const key = getCompanyListKey(search);
    const state = getState() as { companies: CompanyState };

    const cached = state.companies.listCache[key];
    if (cached && Date.now() - cached.fetchedAt < COMPANY_LIST_CACHE_TTL_MS) {
      return {
        key,
        companies: cached.companies,
        fetchedAt: cached.fetchedAt,
      };
    }

    try {
      const res = await companyService.getCompanies(search, signal);
      return {
        key,
        companies: res.data,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch companies');
    }
  },
  {
    condition: (search, { getState }) => {
      const state = getState() as { companies: CompanyState };
      const key = getCompanyListKey(search);

      if (state.companies.listLoading && state.companies.companiesRequestKey === key) {
        if (activeCompaniesSignal && activeCompaniesSignal.aborted) {
          return true;
        }
        return false;
      }

      const cached = state.companies.listCache[key];
      return !(
        cached &&
        Date.now() - cached.fetchedAt < COMPANY_LIST_CACHE_TTL_MS &&
        state.companies.companiesRequestKey === key
      );
    },
  }
);

export const fetchCompanyBySlug = createAsyncThunk(
  'companies/fetchBySlug',
  async (slug: string, { rejectWithValue, getState, signal }) => {
    activeCompanyDetailSignal = signal;
    const key = getCompanyDetailKey(slug);
    const state = getState() as { companies: CompanyState };

    const cached = state.companies.detailCache[key];
    if (cached && Date.now() - cached.fetchedAt < COMPANY_DETAIL_CACHE_TTL_MS) {
      return {
        key,
        company: cached.company,
        fetchedAt: cached.fetchedAt,
      };
    }

    try {
      const res = await companyService.getCompanyBySlug(slug, signal);
      return {
        key,
        company: res.data,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch company detail');
    }
  },
  {
    condition: (slug, { getState }) => {
      const state = getState() as { companies: CompanyState };
      const key = getCompanyDetailKey(slug);

      if (state.companies.detailsLoading && state.companies.companyDetailRequestKey === key) {
        if (activeCompanyDetailSignal && activeCompanyDetailSignal.aborted) {
          return true;
        }
        return false;
      }

      const cached = state.companies.detailCache[key];
      return !(
        cached &&
        Date.now() - cached.fetchedAt < COMPANY_DETAIL_CACHE_TTL_MS &&
        state.companies.companyDetailRequestKey === key
      );
    },
  }
);

const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    invalidateCompanyList(state) {
      delete state.listCache[''];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state, action) => {
        state.listLoading = true;
        state.loading = true;
        state.error = null;
        state.companiesRequestKey = getCompanyListKey(action.meta.arg);
        state.companiesRequestId = action.meta.requestId;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        if (state.companiesRequestId !== action.meta.requestId) return;
        const { key, companies, fetchedAt } = action.payload;
        state.listCache[key] = { companies, fetchedAt };
        if (state.companiesRequestId === action.meta.requestId) {
          state.companies = companies;
          state.listLoading = false;
          state.loading = state.detailsLoading;
          state.companiesRequestId = null;
        }
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        if (state.companiesRequestId === action.meta.requestId) {
          state.listLoading = false;
          state.loading = state.detailsLoading;
          state.companiesRequestId = null;
          if (!action.meta.aborted) {
            state.error = (action.payload as string) || action.error.message || 'Failed to fetch companies';
          }
        }
      })
      .addCase(fetchCompanyBySlug.pending, (state, action) => {
        state.detailError = null;
        if (state.companyDetailRequestKey !== getCompanyDetailKey(action.meta.arg)) {
          state.selectedCompany = null;
        }
        state.detailsLoading = true;
        state.loading = true;
        state.error = null;
        state.companyDetailRequestKey = getCompanyDetailKey(action.meta.arg);
        state.companyDetailRequestId = action.meta.requestId;
      })
      .addCase(fetchCompanyBySlug.fulfilled, (state, action) => {
        if (state.companyDetailRequestId !== action.meta.requestId) return;
        const { key, company, fetchedAt } = action.payload;
        state.detailCache[key] = { company, fetchedAt };
        if (state.companyDetailRequestId === action.meta.requestId) {
          state.selectedCompany = company;
          state.detailsLoading = false;
          state.loading = state.listLoading;
          state.companyDetailRequestId = null;
        }
      })
      .addCase(fetchCompanyBySlug.rejected, (state, action) => {
        if (state.companyDetailRequestId === action.meta.requestId) {
          state.detailsLoading = false;
          state.loading = state.listLoading;
          state.companyDetailRequestId = null;
          if (!action.meta.aborted) {
            state.detailError = state.error = (action.payload as string) || action.error.message || 'Failed to fetch company detail';
          }
        }
      });
  },
});

export const { invalidateCompanyList } = companySlice.actions;

export default companySlice.reducer;
