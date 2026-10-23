import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub external dependencies
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
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

// Import centralized validation rules, schemas, and server error mappers
const {
  emailRule,
  passwordRule,
  nameRule,
  optionalPhoneRule,
  optionalUrlRule,
  requiredUrlRule,
  yearRule,
  optionalYearRule,
  aisheCodeRule,
  requiredTextRule,
  loginSchema,
  signupSchema,
  forgotPasswordStep1Schema,
  forgotPasswordStep2Schema,
  personalInfoSchema,
  academicDetailsSchema,
  institutionSelectionSchema,
  adminInstitutionSchema,
  adminCompanySchema,
  adminQuestionSchema,
  adminTestCaseSchema,
  adminLanguageSchema,
  parseServerErrorMessage,
  getActionableErrorMessage,
  mapServerErrorsToForm,
} = await import('../../src/core/validation/index.ts');

describe('PRODUCTION-GRADE VALIDATION & FEEDBACK OVERHAUL', () => {

  describe('1. Common Rules & Sanitization', () => {
    it('emailRule accepts valid standard emails and rejects malformed addresses', () => {
      assert.doesNotThrow(() => emailRule.parse('student@university.edu'));
      assert.doesNotThrow(() => emailRule.parse('user.name+tag@sub.domain.co.in'));
      
      assert.throws(() => emailRule.parse(''), /Enter your email address/);
      assert.throws(() => emailRule.parse('   '), /Enter your email address/);
      assert.throws(() => emailRule.parse('not-an-email'), /Enter a valid email address/);
      assert.throws(() => emailRule.parse('missingdomain@'), /Enter a valid email address/);
    });

    it('passwordRule enforces production minimum 6 characters', () => {
      assert.doesNotThrow(() => passwordRule.parse('P@ssw0rd123'));
      assert.doesNotThrow(() => passwordRule.parse('secret'));
      assert.throws(() => passwordRule.parse(''), /Enter your password/);
      assert.throws(() => passwordRule.parse('12345'), /at least 6 characters/);
    });

    it('nameRule supports international characters, accents, hyphens, and apostrophes', () => {
      assert.doesNotThrow(() => nameRule('First Name').parse("O'Connor"));
      assert.doesNotThrow(() => nameRule('First Name').parse('Mary-Jane'));
      assert.doesNotThrow(() => nameRule('First Name').parse('Renée'));
      assert.doesNotThrow(() => nameRule('First Name').parse('José Silva'));
      assert.doesNotThrow(() => nameRule('First Name').parse('Dr. Smith Jr.'));

      assert.throws(() => nameRule('First Name').parse(''), /Enter your first name/);
      assert.throws(() => nameRule('First Name').parse('A'), /must be at least 2 characters/);
      assert.throws(() => nameRule('First Name').parse('12345'), /should contain only letters/);
    });

    it('optionalPhoneRule validates realistic phone formats when provided', () => {
      assert.equal(optionalPhoneRule.parse(''), '');
      assert.equal(optionalPhoneRule.parse(undefined), undefined);
      assert.doesNotThrow(() => optionalPhoneRule.parse('+1 (555) 234-5678'));
      assert.doesNotThrow(() => optionalPhoneRule.parse('+91 9876543210'));
      assert.doesNotThrow(() => optionalPhoneRule.parse('9876543210'));

      assert.throws(() => optionalPhoneRule.parse('123'), /valid phone number/);
      assert.throws(() => optionalPhoneRule.parse('abc-def-ghij'), /valid phone number/);
    });

    it('urlRules validate web addresses and support relative paths when allowed', () => {
      assert.doesNotThrow(() => optionalUrlRule('Website', false).parse('https://connect2code.org'));
      assert.doesNotThrow(() => optionalUrlRule('Website', false).parse('http://localhost:3000'));
      assert.equal(optionalUrlRule('Website', false).parse(''), '');
      assert.doesNotThrow(() => requiredUrlRule('Website').parse('https://example.com'));
      assert.throws(() => requiredUrlRule('Website').parse(''), /Enter the website/i);

      // allowRelative = true
      assert.doesNotThrow(() => optionalUrlRule('Logo', true).parse('/logo.png'));
      assert.throws(() => optionalUrlRule('Website', false).parse('/logo.png'), /must start with http:\/\/ or https:\/\//);
    });

    it('yearRule and optionalYearRule validate valid year boundaries', () => {
      assert.doesNotThrow(() => yearRule(1900, 2030, 'Year').parse(2024));
      assert.throws(() => yearRule(1900, 2030, 'Year').parse(1850), /must be 1900 or later/);
      assert.equal(optionalYearRule(1900, 2030, 'Year').parse(''), null);
      assert.equal(optionalYearRule(1900, 2030, 'Year').parse(2020), 2020);
    });

    it('requiredTextRule trims whitespace and rejects empty strings', () => {
      assert.equal(requiredTextRule('Title', 3).parse('  Algorithm  '), 'Algorithm');
      assert.throws(() => requiredTextRule('Title', 3).parse('   '), /Enter title/i);
      assert.throws(() => requiredTextRule('Title', 3).parse('AB'), /must be at least 3 characters/);
    });

    it('aisheCodeRule transforms to uppercase and rejects invalid symbols', () => {
      assert.equal(aisheCodeRule.parse('c-12345'), 'C-12345');
      assert.equal(aisheCodeRule.parse('U_0098'), 'U_0098');
      assert.throws(() => aisheCodeRule.parse('C@123'), /can only contain letters, numbers, hyphens/);
      assert.throws(() => aisheCodeRule.parse(''), /Enter the AISHE code/);
    });
  });

  describe('2. Authentication Schemas & Cross-Field Validation', () => {
    it('loginSchema enforces email and password requirements', () => {
      const valid = loginSchema.parse({
        email: 'user@example.com',
        password: 'ValidPassword1!',
      });
      assert.equal(valid.email, 'user@example.com');

      assert.throws(() => loginSchema.parse({ email: '', password: '' }), /Enter your email address/);
    });

    it('signupSchema checks password match and rejects mismatches', () => {
      const validSignup = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'StrongPassword123',
        confirmPassword: 'StrongPassword123',
      };
      assert.doesNotThrow(() => signupSchema.parse(validSignup));

      // Mismatch
      assert.throws(
        () => signupSchema.parse({ ...validSignup, confirmPassword: 'DifferentPassword' }),
        /Passwords do not match/
      );
    });

    it('forgotPassword schemas validate step 1 email and step 2 password reset', () => {
      assert.doesNotThrow(() => forgotPasswordStep1Schema.parse({ email: 'user@c2c.edu' }));
      assert.throws(() => forgotPasswordStep1Schema.parse({ email: 'invalid' }), /valid email address/);

      assert.doesNotThrow(() => forgotPasswordStep2Schema.parse({
        otp: '123456',
        newPassword: 'MyNewPassword123',
        confirmNewPassword: 'MyNewPassword123',
      }));

      assert.throws(() => forgotPasswordStep2Schema.parse({
        otp: '123456',
        newPassword: 'MyNewPassword123',
        confirmNewPassword: 'MismatchPassword',
      }), /Passwords do not match/);
    });
  });

  describe('3. Profile Schemas & Academic Cross-Field Constraints', () => {
    it('academicDetailsSchema enforces passedOutYear >= joinedYear', () => {
      const validAcademic = {
        college: 'National Institute of Technology',
        regNumber: 'CS202201',
        degree: 'B.Tech',
        branch: 'Computer Science',
        joinedYear: 2020,
        passedOutYear: 2024,
        bio: 'Passionate software engineer and competitive programmer.',
      };
      assert.doesNotThrow(() => academicDetailsSchema.parse(validAcademic));

      // Rejects passedOutYear < joinedYear
      assert.throws(
        () => academicDetailsSchema.parse({ ...validAcademic, joinedYear: 2024, passedOutYear: 2022 }),
        /Graduation year cannot be earlier than joined year/
      );
    });

    it('personalInfoSchema validates names and phone number', () => {
      assert.doesNotThrow(() => personalInfoSchema.parse({
        fullName: 'Arya Stark',
        email: 'arya@winterfell.org',
        phone: '+91 9876543210',
      }));

      assert.throws(
        () => personalInfoSchema.parse({ fullName: 'A', email: 'arya@winterfell.org' }),
        /must be at least 2 characters/
      );
    });

    it('institutionSelectionSchema requires selecting a valid institution', () => {
      assert.doesNotThrow(() => institutionSelectionSchema.parse({
        id: 42,
        name: 'Indian Institute of Technology',
      }));

      assert.throws(
        () => institutionSelectionSchema.parse({ id: null, name: '' }),
        /Select your college or university from the search results/
      );
    });
  });

  describe('4. Admin Schemas & Uniqueness/Relationship Rules', () => {
    it('adminInstitutionSchema prevents UNIVERSITY from being affiliated to another university', () => {
      const university = {
        aisheCode: 'U-001',
        name: 'Delhi University',
        institutionType: 'UNIVERSITY',
        universityId: null,
        state: 'Delhi',
        district: 'New Delhi',
        isActive: true,
      };
      assert.doesNotThrow(() => adminInstitutionSchema.parse(university));

      // Attempting to affiliate a University with another universityId
      assert.throws(
        () => adminInstitutionSchema.parse({ ...university, universityId: 99 }),
        /A university cannot be affiliated with another university/
      );
    });

    it('adminCompanySchema validates name, optional website, and optional logo', () => {
      assert.doesNotThrow(() => adminCompanySchema.parse({
        name: 'Google LLC',
        website: 'https://careers.google.com',
        logo: '/logos/google.png',
        isActive: true,
      }));

      assert.throws(
        () => adminCompanySchema.parse({ name: 'G' }),
        /Company name must be at least 2 characters/
      );
    });

    it('adminQuestionSchema validates question title, description, constraints, and test cases', () => {
      const validQuestion = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficultyRefCode: 'EASY',
        difficultyRefName: 'Easy',
        topicRefCode: 'ARRAYS',
        topicRefName: 'Arrays',
        qpfRefCode: 'LC',
        qpfRefName: 'LeetCode',
        constraints: '1 <= nums.length <= 10^4',
        editorial: '',
      };
      assert.doesNotThrow(() => adminQuestionSchema.parse(validQuestion));

      assert.throws(
        () => adminQuestionSchema.parse({ ...validQuestion, title: '' }),
        /Enter title/i
      );
      assert.throws(
        () => adminQuestionSchema.parse({ ...validQuestion, difficultyRefCode: '' }),
        /Difficulty is required/
      );
    });

    it('adminTestCaseSchema validates required raw input and expected output', () => {
      assert.doesNotThrow(() => adminTestCaseSchema.parse({
        input: '5\\n1 2 3 4 5',
        expectedOutput: '15',
        typeRefCode: 'SAMPLE',
        isHidden: false,
      }));

      assert.throws(
        () => adminTestCaseSchema.parse({ input: '', expectedOutput: '15', typeRefCode: 'SAMPLE' }),
        /Input raw string is required/
      );
    });

    it('adminLanguageSchema validates Judge0 ID and Reference ID', () => {
      assert.doesNotThrow(() => adminLanguageSchema.parse({
        referenceId: 5,
        judge0LanguageId: 62,
        version: 'Java 17',
        isActive: true,
      }));

      assert.throws(
        () => adminLanguageSchema.parse({ referenceId: 0, judge0LanguageId: 62 }),
        /Select a valid language from the list/
      );
    });
  });

  describe('5. Real Server Error Mapping & Security Sanitization', () => {
    it('parses structured backend errors with errors array or C2CResponse format', () => {
      const c2cResponse = {
        statusCode: 400,
        message: 'Validation Failed',
        errors: ['AISHE code already exists in database'],
      };
      const parsed = parseServerErrorMessage(c2cResponse);
      assert.equal(parsed, 'AISHE code already exists in database');
    });

    it('sanitizes internal implementation leaks (stack traces, Java database references)', () => {
      const leakedError = {
        statusCode: 500,
        message: 'org.hibernate.exception.ConstraintViolationException: could not execute statement on Java Database',
      };
      const sanitized = getActionableErrorMessage(leakedError);
      assert.equal(sanitized, 'Our servers encountered an issue while processing your request. Please try again shortly.');
    });

    it('maps HTTP status codes to user-friendly actionable guidance', () => {
      assert.equal(
        getActionableErrorMessage({ statusCode: 401 }),
        'Your session has expired. Please log in again to continue.'
      );
      assert.equal(
        getActionableErrorMessage({ statusCode: 403 }),
        'You do not have permission to perform this action.'
      );
      assert.equal(
        getActionableErrorMessage({ statusCode: 404 }),
        'The requested resource could not be found.'
      );
      assert.equal(
        getActionableErrorMessage({ statusCode: 408 }),
        'The server took too long to respond. Please try again in a moment.'
      );
      assert.equal(
        getActionableErrorMessage({ statusCode: 429 }),
        'Too many requests. Please wait a moment before trying again.'
      );
    });

    it('maps network dropouts and connection failures', () => {
      assert.equal(
        getActionableErrorMessage({ message: 'Network Error' }),
        "We couldn't connect to the server. Check your connection and try again."
      );
      assert.equal(
        getActionableErrorMessage({ code: 'ECONNREFUSED' }),
        "We couldn't connect to the server. Check your connection and try again."
      );
    });

    it('maps server validation field errors to React Hook Form setError', () => {
      const fieldErrors = [];
      const mockSetError = (field, err) => {
        fieldErrors.push({ field, message: err.message });
      };

      const serverPayload = {
        fieldErrors: {
          aisheCode: 'Duplicate AISHE code found',
          website: 'Invalid URL format',
        },
      };

      const handled = mapServerErrorsToForm(serverPayload, mockSetError);
      assert.equal(handled, true);
      assert.equal(fieldErrors.length, 2);
      assert.equal(fieldErrors[0].field, 'aisheCode');
      assert.equal(fieldErrors[0].message, 'Duplicate AISHE code found');
    });
  });
});
