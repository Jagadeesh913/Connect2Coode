import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const {
  resolveTestCaseType,
  reconcileTestCasesWithReferenceTypes,
  extractTestCasesFromProblem,
  validateTestCase,
} = await import('../../src/features/admin/utils/testCaseUtils.ts');

const { adminTestCaseSchema } = await import('../../src/core/validation/schemas/adminSchemas.ts');
const { questionService } = await import('../../src/services/questionService.ts');
const { apiClient } = await import('../../src/core/api/apiClient.ts');

const mockReferenceOptions = [
  {
    id: 1,
    refGroupCode: 'TESTCASETYPE',
    refCode: 'SAMPLE',
    refName: 'Visible Sample Test Case',
    isActive: true,
  },
  {
    id: 2,
    refGroupCode: 'TESTCASETYPE',
    refCode: 'NECESSARY',
    refName: 'Mandatory Test Case',
    isActive: true,
  },
];

describe('REGRESSION: TestCase Type Integrity & NPE Prevention', () => {
  describe('1. Semantic Type Resolution & Default Prevention', () => {
    it('resolves visible test case to SAMPLE reference option', () => {
      const resolved = resolveTestCaseType(mockReferenceOptions, false);
      assert.equal(resolved?.refCode, 'SAMPLE');
      assert.equal(resolved?.refName, 'Visible Sample Test Case');
      assert.equal(resolved?.refGroupCode, 'TESTCASETYPE');
    });

    it('resolves hidden test case to NECESSARY reference option', () => {
      const resolved = resolveTestCaseType(mockReferenceOptions, true);
      assert.equal(resolved?.refCode, 'NECESSARY');
      assert.equal(resolved?.refName, 'Mandatory Test Case');
      assert.equal(resolved?.refGroupCode, 'TESTCASETYPE');
    });

    it('preserves existing valid type code when already assigned', () => {
      const resolved = resolveTestCaseType(mockReferenceOptions, false, 'NECESSARY');
      assert.equal(resolved?.refCode, 'NECESSARY');
    });

    it('never invents defaults when reference options are unavailable or empty', () => {
      const resolved = resolveTestCaseType([], false);
      assert.equal(resolved, undefined);
    });
  });

  describe('2. Test Case Reconciliation across Visible, Hidden, and Imported Cases', () => {
    it('reconciles imported/extracted test cases missing typeRefCode using actual options', () => {
      const rawImported = [
        {
          input: '1 2',
          expectedOutput: '3',
          explanation: '',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: '',
          typeRefCode: '',
          typeRefName: '',
        },
        {
          input: '-5 10',
          expectedOutput: '5',
          explanation: '',
          isHidden: true,
          displayOrder: 2,
          typeRefGroupCode: '',
          typeRefCode: '',
          typeRefName: '',
        },
      ];

      const reconciled = reconcileTestCasesWithReferenceTypes(rawImported, mockReferenceOptions);
      assert.equal(reconciled.length, 2);

      // Visible case gets SAMPLE
      assert.equal(reconciled[0].typeRefCode, 'SAMPLE');
      assert.equal(reconciled[0].typeRefName, 'Visible Sample Test Case');
      assert.equal(reconciled[0].typeRefGroupCode, 'TESTCASETYPE');
      assert.equal(reconciled[0].input, '1 2');

      // Hidden case gets NECESSARY
      assert.equal(reconciled[1].typeRefCode, 'NECESSARY');
      assert.equal(reconciled[1].typeRefName, 'Mandatory Test Case');
      assert.equal(reconciled[1].typeRefGroupCode, 'TESTCASETYPE');
      assert.equal(reconciled[1].input, '-5 10');
    });

    it('preserves existing valid typeRefCode on edited test cases without overwriting', () => {
      const editedCases = [
        {
          input: '10',
          expectedOutput: '20',
          explanation: 'Sample',
          isHidden: false,
          displayOrder: 1,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: 'SAMPLE',
          typeRefName: 'Visible Sample Test Case',
        },
        {
          input: '100',
          expectedOutput: '200',
          explanation: 'Hidden verification',
          isHidden: true,
          displayOrder: 2,
          typeRefGroupCode: 'TESTCASETYPE',
          typeRefCode: 'NECESSARY',
          typeRefName: 'Mandatory Test Case',
        },
      ];

      const reconciled = reconcileTestCasesWithReferenceTypes(editedCases, mockReferenceOptions);
      assert.equal(reconciled[0].typeRefCode, 'SAMPLE');
      assert.equal(reconciled[1].typeRefCode, 'NECESSARY');
    });
  });

  describe('3. Problem Extraction Integration with Reference Options', () => {
    it('populates valid SAMPLE type on extracted markdown cases when reference options are provided', () => {
      const problem = {
        id: 77,
        title: 'Sample Extracted Problem',
        description: 'Example 1:\nInput: a = 1\nOutput: 2\n\nExample 2:\nInput: a = 2\nOutput: 4',
      };

      const extracted = extractTestCasesFromProblem(problem, mockReferenceOptions);
      assert.equal(extracted.length, 2);
      assert.equal(extracted[0].typeRefCode, 'SAMPLE');
      assert.equal(extracted[0].typeRefName, 'Visible Sample Test Case');
      assert.equal(extracted[1].typeRefCode, 'SAMPLE');
    });

    it('preserves explicit backend testCases types when provided', () => {
      const problem = {
        id: 88,
        title: 'Explicit Problem',
        testCases: [
          {
            id: 1,
            input: '1',
            expectedOutput: '2',
            isHidden: false,
            displayOrder: 1,
            typeRefGroupCode: 'TESTCASETYPE',
            typeRefCode: 'SAMPLE',
            typeRefName: 'Visible Sample Test Case',
          },
          {
            id: 2,
            input: '3',
            expectedOutput: '6',
            isHidden: true,
            displayOrder: 2,
            typeRefGroupCode: 'TESTCASETYPE',
            typeRefCode: 'NECESSARY',
            typeRefName: 'Mandatory Test Case',
          },
        ],
      };

      const extracted = extractTestCasesFromProblem(problem, mockReferenceOptions);
      assert.equal(extracted.length, 2);
      assert.equal(extracted[0].typeRefCode, 'SAMPLE');
      assert.equal(extracted[1].typeRefCode, 'NECESSARY');
    });
  });

  describe('4. Validation & Empty typeRefCode Payload Prevention', () => {
    it('validateTestCase rejects empty or unassigned typeRefCode', () => {
      const invalidTc = {
        input: '1',
        expectedOutput: '2',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: '',
      };

      const err = validateTestCase(invalidTc, mockReferenceOptions);
      assert.notEqual(err, null);
      assert.equal(err?.typeRefCode, 'Test case type is required');
    });

    it('validateTestCase rejects typeRefCode not present in backend reference options', () => {
      const invalidTc = {
        input: '1',
        expectedOutput: '2',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'NONEXISTENT_TYPE',
      };

      const err = validateTestCase(invalidTc, mockReferenceOptions);
      assert.notEqual(err, null);
      assert.equal(err?.typeRefCode, 'Select a valid type from the reference library');
    });

    it('validateTestCase succeeds when input, output, and typeRefCode are valid', () => {
      const validTc = {
        input: '1',
        expectedOutput: '2',
        isHidden: false,
        displayOrder: 1,
        typeRefGroupCode: 'TESTCASETYPE',
        typeRefCode: 'SAMPLE',
      };

      const err = validateTestCase(validTc, mockReferenceOptions);
      assert.equal(err, null);
    });

    it('adminTestCaseSchema rejects empty typeRefCode', () => {
      const result = adminTestCaseSchema.safeParse({
        input: '1',
        expectedOutput: '2',
        typeRefCode: '',
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error.issues[0].path[0], 'typeRefCode');
      }
    });

    it('questionService.addTestCases rejects payloads with empty string typeRefCode', async () => {
      const invalidPayload = [
        {
          input: '1',
          expectedOutput: '2',
          typeRefCode: '',
        },
      ];

      await assert.rejects(
        () => questionService.addTestCases(42, invalidPayload),
        /Test cases must not contain empty typeRefCode references/
      );
    });

    it('questionService.addTestCases accepts valid test cases and dispatches to endpoint', async () => {
      const originalPost = apiClient.post;
      let capturedPayload = null;

      apiClient.post = async (url, payload) => {
        capturedPayload = payload;
        return { statusCode: 200, message: 'Saved', data: payload };
      };

      try {
        const validPayload = [
          {
            input: '1',
            expectedOutput: '2',
            typeRefCode: 'SAMPLE',
            typeRefName: 'Visible Sample Test Case',
            typeRefGroupCode: 'TESTCASETYPE',
            isHidden: false,
            displayOrder: 1,
          },
          {
            input: '10',
            expectedOutput: '20',
            typeRefCode: 'NECESSARY',
            typeRefName: 'Mandatory Test Case',
            typeRefGroupCode: 'TESTCASETYPE',
            isHidden: true,
            displayOrder: 2,
          },
        ];

        const res = await questionService.addTestCases(42, validPayload);
        assert.equal(res.statusCode, 200);
        assert.equal(capturedPayload?.length, 2);
        assert.equal(capturedPayload?.[0]?.typeRefCode, 'SAMPLE');
        assert.equal(capturedPayload?.[1]?.typeRefCode, 'NECESSARY');
      } finally {
        apiClient.post = originalPost;
      }
    });
  });
});
