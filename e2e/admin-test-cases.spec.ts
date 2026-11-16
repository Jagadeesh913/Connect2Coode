import { test, expect } from '@playwright/test';

test.describe('Admin Test Case Type Management & NPE Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock Admin Auth Session Refresh
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: {
            token: 'mock-admin-bearer-token',
            user: {
              id: 1,
              email: 'admin@connect2code.in',
              firstName: 'Admin',
              lastName: 'Superuser',
              role: 'ADMIN',
            },
          },
        }),
      });
    });

    // 2. Mock Reference Library Taxonomy: TESTCASETYPE, DIFF, TOPIC, QPF
    await page.route('**/api/v1/referenceLibrary/refGroupCode/TESTCASETYPE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: [
            { id: 10, refGroupCode: 'TESTCASETYPE', refCode: 'SAMPLE', refName: 'Visible Sample Test Case', isActive: true },
            { id: 11, refGroupCode: 'TESTCASETYPE', refCode: 'NECESSARY', refName: 'Mandatory Test Case', isActive: true },
            { id: 12, refGroupCode: 'TESTCASETYPE', refCode: 'CUSTOM_EDGE', refName: 'Custom Edge Case', isActive: true },
          ],
        }),
      });
    });

    await page.route('**/api/v1/referenceLibrary/refGroupCode/DIFF', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: [{ id: 1, refGroupCode: 'DIFF', refCode: 'EASY', refName: 'Easy', isActive: true }],
        }),
      });
    });

    await page.route('**/api/v1/referenceLibrary/refGroupCode/TOPIC', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: [{ id: 2, refGroupCode: 'TOPIC', refCode: 'ARRAYS', refName: 'Arrays', isActive: true }],
        }),
      });
    });

    await page.route('**/api/v1/referenceLibrary/refGroupCode/QPF', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: [{ id: 3, refGroupCode: 'QPF', refCode: 'LEETCODE', refName: 'LeetCode', isActive: true }],
        }),
      });
    });

    await page.route('**/api/v1/company/list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: [],
        }),
      });
    });

    // 3. Mock Questions Catalog
    await page.route('**/api/v1/questions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: {
            content: [
              {
                id: 101,
                title: 'Two Sum Problem',
                description: 'Given an array of integers nums and an integer target, return indices of the two numbers.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
                constraints: '2 <= nums.length <= 10^4',
                timeLimit: 1.0,
                memoryLimit: 256.0,
                difficultyId: 1,
                difficultyName: 'Easy',
                topicId: 2,
                topicName: 'Arrays',
                isOwnProblem: true,
                isActive: true,
                companies: [],
              },
            ],
            pageNumber: 0,
            pageSize: 10,
            totalElements: 1,
            totalPages: 1,
          },
        }),
      });
    });
  });

  test('admin question create modal initializes test cases with valid SAMPLE type', async ({ page }) => {
    await page.goto('/admin/questions');

    // Click "Create Question"
    const createBtn = page.getByRole('button', { name: /Create Question/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Switch to "2. Test Cases" tab
    const testCasesTab = page.getByRole('button', { name: /2\.\s*Test Cases/i });
    await expect(testCasesTab).toBeVisible();
    await testCasesTab.click();

    // Verify initial testcase has type defaulted to SAMPLE
    const initialTypeSelect = page.locator('#tc-type-0');
    await expect(initialTypeSelect).toBeVisible();
    await expect(initialTypeSelect).toHaveText(/Visible Sample Test Case|SAMPLE/i);

    // Click "Add Test Case"
    const addTestCaseBtn = page.getByRole('button', { name: /Add Test\s*Case/i });
    await addTestCaseBtn.click();

    // Verify second testcase also defaults to valid SAMPLE type
    const secondTypeSelect = page.locator('#tc-type-1');
    await expect(secondTypeSelect).toBeVisible();
    await expect(secondTypeSelect).toHaveText(/Visible Sample Test Case|SAMPLE/i);
  });

  test('visible/hidden toggle automatically switches between SAMPLE and NECESSARY types', async ({ page }) => {
    await page.goto('/admin/questions');

    // Open Create Question modal and navigate to Test Cases
    await page.getByRole('button', { name: /Create Question/i }).click();
    await page.getByRole('button', { name: /2\.\s*Test Cases/i }).click();

    // Confirm initial state is visible and SAMPLE
    const typeSelect = page.locator('#tc-type-0');
    await expect(typeSelect).toHaveText(/Visible Sample Test Case|SAMPLE/i);

    // Toggle Hidden checkbox
    const hiddenCheckbox = page.locator('input[type="checkbox"]').first();
    await hiddenCheckbox.check();

    // Verify type automatically switched to NECESSARY (Mandatory Test Case)
    await expect(typeSelect).toHaveText(/Mandatory Test Case|NECESSARY/i);

    // Toggle back to visible
    await hiddenCheckbox.uncheck();

    // Verify type automatically switched back to SAMPLE
    await expect(typeSelect).toHaveText(/Visible Sample Test Case|SAMPLE/i);
  });

  test('imported markdown example cases are automatically reconciled with valid SAMPLE type', async ({ page }) => {
    // Mock question detail with description examples but empty testCases array
    await page.route('**/api/v1/question/101', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: {
            id: 101,
            title: 'Two Sum Problem',
            description: 'Example 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
            constraints: '2 <= nums.length <= 10^4',
            timeLimit: 1.0,
            memoryLimit: 256.0,
            difficultyRefName: 'Easy',
            topicRefName: 'Arrays',
            testCases: [],
          },
        }),
      });
    });

    await page.goto('/admin/questions');

    // Click "Manage Test Cases" for question 101
    const manageBtn = page.getByRole('button', { name: /Manage test cases for question 101/i });
    await expect(manageBtn).toBeVisible({ timeout: 10000 });
    await manageBtn.click();

    // Verify Manage Test Cases modal is open
    const modalTitle = page.locator('text=Manage Test Cases — Two Sum Problem');
    await expect(modalTitle).toBeVisible();

    // Verify extracted case #1 has input populated from markdown
    const inputField = page.locator('#test-case-input-0');
    await expect(inputField).toBeVisible();
    await expect(inputField).toHaveValue(/nums = \[2,7,11,15\]/);

    // Verify type was automatically reconciled to SAMPLE (never empty)
    const typeSelect = page.locator('#test-case-type-0');
    await expect(typeSelect).toBeVisible();
    await expect(typeSelect).toHaveText(/Visible Sample Test Case|SAMPLE/i);
  });

  test('preserves existing custom types on edit and sends non-empty typeRefCode payload', async ({ page }) => {
    let capturedPayload: unknown = null;

    // Mock question detail with an existing CUSTOM_EDGE test case
    await page.route('**/api/v1/question/101', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: {
            id: 101,
            title: 'Two Sum Problem',
            description: 'Two sum description',
            testCases: [
              {
                id: 501,
                questionId: 101,
                input: '10 20',
                expectedOutput: '30',
                explanation: 'Edge case explanation',
                isHidden: false,
                displayOrder: 1,
                typeRefGroupCode: 'TESTCASETYPE',
                typeRefCode: 'CUSTOM_EDGE',
                typeRefName: 'Custom Edge Case',
              },
            ],
          },
        }),
      });
    });

    // Capture the save payload
    await page.route('**/api/v1/question/101/testCases', async (route) => {
      capturedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'Test Cases Updated',
          data: capturedPayload,
        }),
      });
    });

    await page.goto('/admin/questions');

    const manageBtn = page.getByRole('button', { name: /Manage test cases for question 101/i });
    await expect(manageBtn).toBeVisible({ timeout: 10000 });
    await manageBtn.click();

    // Verify existing custom type is preserved in the dropdown
    const typeSelect = page.locator('#test-case-type-0');
    await expect(typeSelect).toBeVisible();
    await expect(typeSelect).toHaveText(/Custom Edge Case|CUSTOM_EDGE/i);

    // Edit input string
    const inputField = page.locator('#test-case-input-0');
    await inputField.fill('15 25');

    // Click "Save 1 Test Cases" button
    const saveBtn = page.getByRole('button', { name: /Save 1 Test Cases/i });
    await saveBtn.click();

    // Wait for save completion
    await expect(page.locator('text=Successfully saved 1 test cases for Question #101')).toBeVisible({ timeout: 10000 });

    // Verify the captured payload strictly preserved CUSTOM_EDGE and contains no empty strings
    expect(capturedPayload).not.toBeNull();
    const payloadArray = capturedPayload as Array<{ typeRefCode: string; input: string; expectedOutput: string }>;
    expect(payloadArray.length).toBe(1);
    expect(payloadArray[0].typeRefCode).toBe('CUSTOM_EDGE');
    expect(payloadArray[0].input).toBe('15 25');
    expect(payloadArray[0].expectedOutput).toBe('30');
  });

  test('prevents submission when required test case fields are empty and shows validation errors', async ({ page }) => {
    let saveAttempted = false;

    await page.route('**/api/v1/question/101', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: {
            id: 101,
            title: 'Two Sum Problem',
            description: 'Two sum description',
            testCases: [
              {
                id: 601,
                input: '5',
                expectedOutput: '10',
                isHidden: false,
                displayOrder: 1,
                typeRefCode: 'SAMPLE',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/v1/question/101/testCases', async (route) => {
      saveAttempted = true;
      await route.fulfill({ status: 200, body: JSON.stringify({ statusCode: 200 }) });
    });

    await page.goto('/admin/questions');

    const manageBtn = page.getByRole('button', { name: /Manage test cases for question 101/i });
    await manageBtn.click();

    // Clear input field to make it invalid
    const inputField = page.locator('#test-case-input-0');
    await inputField.fill('');

    // Click Save
    const saveBtn = page.getByRole('button', { name: /Save 1 Test Cases/i });
    await saveBtn.click();

    // Verify error toast/message appears
    await expect(page.locator('text=/Input raw string is required|Please resolve missing/i').first()).toBeVisible();

    // Confirm no network request was sent to backend
    expect(saveAttempted).toBe(false);
  });
});
