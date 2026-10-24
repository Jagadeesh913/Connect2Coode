import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  loginUser,
  setAuthModalMode,
  generatePasswordResetOtpThunk,
  verifyPasswordResetOtpThunk,
} from '../redux/authSlice';
import { authService } from '../../../services/authService';
import { toast } from 'react-hot-toast';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useGoogleOAuthLogin } from '../hooks/useGoogleOAuthLogin';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { isJwtAdmin } from '../../../core/security/jwt';

import {
  loginSchema,
  signupSchema,
  forgotPasswordStep1Schema,
  forgotPasswordStep2Schema,
  LoginFormData,
  SignupFormData,
  getActionableErrorMessage,
} from '../../../core/validation';
import { FormFieldError } from '../../../shared/components/ui/FormFieldError';


interface NavigationLocationState {
  from?:
    | {
        pathname?: string;
        search?: string;
        hash?: string;
      }
    | string;
}

interface AuthPageProps {
  defaultMode?: 'login' | 'signup' | 'forgot';
  onCloseModal?: () => void;
}

export const Login: React.FC<AuthPageProps> = ({ defaultMode, onCloseModal }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, authModalMode } = useAppSelector((state) => state.auth);

  const initialMode =
    defaultMode ||
    authModalMode ||
    (location.pathname === '/signup'
      ? 'signup'
      : location.pathname === '/forgot-password'
      ? 'forgot'
      : 'login');

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loginSubmitting, setLoginSubmitting] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // DIRECT SIGNUP STATE (NO OTP)
  // --------------------------------------------------------------------------
  const [signupLoading, setSignupLoading] = useState<boolean>(false);
  const [signupError, setSignupError] = useState<string>('');

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD STATE (EXACT 2-STEP OTP FLOW)
  // --------------------------------------------------------------------------
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Send OTP, 2: Verify OTP & Reset
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtpCode, setForgotOtpCode] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState<boolean>(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState<number>(0);
  const [forgotOtpLoading, setForgotOtpLoading] = useState<boolean>(false);
  const [forgotOtpError, setForgotOtpError] = useState<string>('');
  const [forgotCodeError, setForgotCodeError] = useState<string>('');
  const [forgotNewPasswordError, setForgotNewPasswordError] = useState<string>('');
  const [forgotConfirmPasswordError, setForgotConfirmPasswordError] = useState<string>('');

  // Sync mode with Redux authModalMode
  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
  }, [authModalMode]);


  // Forgot Password OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [forgotOtpTimer]);

  // React Hook Form for Login
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // React Hook Form for Signup
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    reset: resetSignup,
    formState: { errors: signupErrors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });


  const handleClose = () => {
    if (onCloseModal) {
      onCloseModal();
    } else {
      navigate('/');
    }
  };

  const { initiateGoogleLogin } = useGoogleOAuthLogin();

  // --------------------------------------------------------------------------
  // LOGIN SUBMIT
  // --------------------------------------------------------------------------
  const onLoginSubmit = async (data: LoginFormData) => {
    setLoginSubmitting(true);
    try {
      const result = await dispatch(loginUser(data));
      if (loginUser.fulfilled.match(result)) {
        const userObj = result.payload as any;
        const userName = userObj?.firstName || userObj?.fullName || 'User';
        toast.success(`Welcome ${userName}`);

        const token = userObj?.accessToken || userObj?.token || tokenStorage.getAccessToken();
        const isAdmin = isJwtAdmin(token);

        if (onCloseModal) {
          onCloseModal();
        }

        const navLocationState = location.state as NavigationLocationState | null;
        const from = navLocationState?.from;
        let targetUrl: string | null = null;

        if (from) {
          if (typeof from === 'string') {
            targetUrl = from;
          } else if (from.pathname) {
            targetUrl = `${from.pathname}${from.search || ''}${from.hash || ''}`;
          }
        }

        if (!targetUrl) {
          try {
            const saved = sessionStorage.getItem('post_auth_redirect');
            if (saved) {
              targetUrl = saved;
            }
          } catch {}
        }

        try {
          sessionStorage.removeItem('post_auth_redirect');
        } catch {}

        if (isAdmin) {
          navigate(targetUrl?.startsWith('/admin') ? targetUrl : '/admin/dashboard', { replace: true });
        } else if (targetUrl && targetUrl !== '/login' && targetUrl !== '/signup') {
          navigate(targetUrl, { replace: true });
        } else {
          navigate('/practice', { replace: true });
        }
      } else {
        toast.error(getActionableErrorMessage(result.payload, 'Invalid email or password. Please verify and try again.'));
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // DIRECT SIGNUP (NO OTP REQUIRED)
  // --------------------------------------------------------------------------
  const onSignupSubmit = async (data: SignupFormData) => {
    setSignupError('');
    setSignupLoading(true);

    try {
      const signUpRes = await authService.signUp({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        role: 'USER',
      });

      setSignupLoading(false);

      if (signUpRes && (signUpRes.statusCode === 200 || signUpRes.statusCode === 201 || signUpRes.data)) {
        toast.success('Account created successfully! Please log in with your credentials.');
        setLoginValue('email', data.email.trim());
        resetSignup();
        setMode('login');
        dispatch(setAuthModalMode('login'));
      } else {
        const errMsg = getActionableErrorMessage(signUpRes, 'Failed to create account.');
        setSignupError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      setSignupLoading(false);
      const errMsg = getActionableErrorMessage(err, 'Failed to create account. Please try again.');
      setSignupError(errMsg);
      toast.error(errMsg);
    }
  };

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD STEP 1: SEND RESET OTP
  // --------------------------------------------------------------------------
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parseResult = forgotPasswordStep1Schema.safeParse({ email: forgotEmail });
    if (!parseResult.success) {
      setForgotOtpError(parseResult.error.issues[0]?.message || 'Enter your email address.');
      return;
    }
    setForgotOtpError('');
    setForgotOtpLoading(true);

    try {
      const res = await dispatch(generatePasswordResetOtpThunk(forgotEmail.trim()));
      setForgotOtpLoading(false);

      if (generatePasswordResetOtpThunk.fulfilled.match(res)) {
        const msg = (res.payload as string) || 'Password reset OTP sent successfully! Check your inbox.';
        toast.success(msg, { duration: 6000 });
        setForgotStep(2);
        setForgotOtpTimer(60);
        setForgotOtpCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotCodeError('');
        setForgotNewPasswordError('');
        setForgotConfirmPasswordError('');
      } else {
        const errMsg = getActionableErrorMessage(res.payload, 'Failed to send OTP. Please check email address.');
        setForgotOtpError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      setForgotOtpLoading(false);
      const errMsg = getActionableErrorMessage(err, 'Failed to send OTP.');
      setForgotOtpError(errMsg);
      toast.error(errMsg);
    }
  };

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD STEP 2: VERIFY OTP & RESET PASSWORD WITH STRICT VALIDATION
  // --------------------------------------------------------------------------
  const handleVerifyForgotOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotOtpError('');
    setForgotCodeError('');
    setForgotNewPasswordError('');
    setForgotConfirmPasswordError('');

    const parseResult = forgotPasswordStep2Schema.safeParse({
      otp: forgotOtpCode,
      newPassword: forgotNewPassword,
      confirmNewPassword: forgotConfirmPassword,
    });

    if (!parseResult.success) {
      parseResult.error.issues.forEach((err) => {
        const path = err.path[0];
        if (path === 'otp') setForgotCodeError(err.message);
        else if (path === 'newPassword') setForgotNewPasswordError(err.message);
        else if (path === 'confirmNewPassword') setForgotConfirmPasswordError(err.message);
      });
      return;
    }

    setForgotOtpLoading(true);

    try {
      const res = await dispatch(
        verifyPasswordResetOtpThunk({
          email: forgotEmail.trim(),
          otp: forgotOtpCode.trim(),
          password: forgotNewPassword,
        })
      );

      setForgotOtpLoading(false);

      if (verifyPasswordResetOtpThunk.fulfilled.match(res)) {
        toast.success('Password Reset Successfully! Please log in with your new password.');
        setLoginValue('email', forgotEmail.trim());
        setMode('login');
        dispatch(setAuthModalMode('login'));
        setForgotStep(1);
        setForgotOtpCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        const errMsg = (res.payload as string) || 'Failed to reset password. Invalid or expired OTP.';
        setForgotOtpError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      setForgotOtpLoading(false);
      setForgotOtpError(err?.message || 'Error resetting password.');
      toast.error(err?.message || 'Error resetting password.');
    }
  };

  const handleResendForgotOtp = async () => {
    if (!forgotEmail.trim() || forgotOtpTimer > 0) return;
    setForgotOtpLoading(true);
    setForgotOtpError('');
    try {
      const res = await dispatch(generatePasswordResetOtpThunk(forgotEmail.trim()));
      setForgotOtpLoading(false);
      if (generatePasswordResetOtpThunk.fulfilled.match(res)) {
        const msg = (res.payload as string) || `New OTP sent to ${forgotEmail.trim()}!`;
        toast.success(msg, { duration: 6000 });
        setForgotOtpTimer(60);
      } else {
        toast.error((res.payload as string) || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setForgotOtpLoading(false);
      toast.error(err?.message || 'Failed to resend OTP.');
    }
  };

  const isModal = Boolean(onCloseModal);

  const cardElement = (
    <div className={`relative w-full max-w-md bg-neutral-900 border border-white/15 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-5 sm:p-8 text-white ${isModal ? 'my-auto max-h-[90vh] overflow-y-auto' : ''} animate-scale-up`}>
      {/* Close Button */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white w-8 h-8 rounded-full bg-neutral-950 border border-white/15 hover:border-white/40 flex items-center justify-center transition-colors cursor-pointer z-10"
        aria-label={isModal ? 'Close modal' : 'Back to Home'}
      >
        <i className="fa-solid fa-xmark text-sm"></i>
      </button>

        {/* ================================================================= */}
        {/* 1. LOG IN MODE                                                    */}
        {/* ================================================================= */}
        {mode === 'login' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                Log in
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                New user ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    dispatch(setAuthModalMode('signup'));
                  }}
                  className="text-neutral-300 hover:underline font-bold cursor-pointer"
                >
                  Register Now
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="flex flex-col gap-4">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-gray-200">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  aria-invalid={Boolean(loginErrors.email)}
                  aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
                  placeholder="Enter email address"
                  className={`w-full bg-neutral-950 border ${
                    loginErrors.email ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                  } text-sm text-white placeholder-gray-500 px-3.5 py-2.5 rounded-lg outline-none transition-all`}
                  {...registerLogin('email')}
                />
                <FormFieldError id="login-email-error" error={loginErrors.email?.message} />
              </div>

              {/* Password & Forgot Password Link */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-medium text-gray-200">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotStep(1);
                      setForgotEmail('');
                      setForgotOtpCode('');
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                      setForgotOtpError('');
                      dispatch(setAuthModalMode('forgot'));
                    }}
                    className="text-xs text-neutral-300 hover:underline font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    aria-invalid={Boolean(loginErrors.password)}
                    aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
                    placeholder="Enter password"
                    className={`w-full bg-neutral-950 border ${
                      loginErrors.password ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                    } text-sm text-white placeholder-gray-500 px-3.5 py-2.5 pr-10 rounded-lg outline-none transition-all`}
                    {...registerLogin('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <FormFieldError id="login-password-error" error={loginErrors.password?.message} />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full py-3 px-4 mt-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold text-base rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg  active:scale-[0.99] disabled:opacity-50 font-sans"
              >
                {loginSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center my-1">
                <div className="grow border-t border-white/10"></div>
                <span className="shrink mx-3 text-xs text-gray-400 font-sans uppercase tracking-wider">or</span>
                <div className="grow border-t border-white/10"></div>
              </div>

              {/* Google OAuth Log In */}
              <GoogleSignInButton
                onClick={initiateGoogleLogin}
                disabled={loading}
                text="Continue with Google"
              />
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. SIGN UP MODE (DIRECT SIGNUP - NO OTP)                         */}
        {/* ================================================================= */}
        {mode === 'signup' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
                Create Account
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                Already have an account ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    dispatch(setAuthModalMode('login'));
                  }}
                  className="text-neutral-300 hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="flex flex-col gap-3.5">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-first-name" className="text-xs font-medium text-gray-200">First Name</label>
                  <input
                    id="signup-first-name"
                    type="text"
                    aria-invalid={Boolean(signupErrors.firstName)}
                    aria-describedby={signupErrors.firstName ? 'signup-first-name-error' : undefined}
                    placeholder="e.g. Venkat"
                    className={`w-full bg-neutral-950 border ${
                      signupErrors.firstName ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                    } text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none`}
                    {...registerSignup('firstName')}
                  />
                  <FormFieldError id="signup-first-name-error" error={signupErrors.firstName?.message} />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-last-name" className="text-xs font-medium text-gray-200">Last Name</label>
                  <input
                    id="signup-last-name"
                    type="text"
                    aria-invalid={Boolean(signupErrors.lastName)}
                    aria-describedby={signupErrors.lastName ? 'signup-last-name-error' : undefined}
                    placeholder="e.g. Kaveti"
                    className={`w-full bg-neutral-950 border ${
                      signupErrors.lastName ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                    } text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none`}
                    {...registerSignup('lastName')}
                  />
                  <FormFieldError id="signup-last-name-error" error={signupErrors.lastName?.message} />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label htmlFor="signup-email" className="text-xs font-medium text-gray-200">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  aria-invalid={Boolean(signupErrors.email)}
                  aria-describedby={signupErrors.email ? 'signup-email-error' : undefined}
                  placeholder="e.g. venkat@mailinator.com"
                  className={`w-full bg-neutral-950 border ${
                    signupErrors.email ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                  } text-xs text-white placeholder-gray-500 px-3 py-2 rounded-lg outline-none`}
                  {...registerSignup('email')}
                />
                <FormFieldError id="signup-email-error" error={signupErrors.email?.message} />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label htmlFor="signup-password" className="text-xs font-medium text-gray-200">Password</label>
                <div className="relative flex items-center">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    aria-invalid={Boolean(signupErrors.password)}
                    aria-describedby={signupErrors.password ? 'signup-password-error' : undefined}
                    placeholder="Create a password (min 6 characters)"
                    className={`w-full bg-neutral-950 border ${
                      signupErrors.password ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                    } text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none`}
                    {...registerSignup('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <FormFieldError id="signup-password-error" error={signupErrors.password?.message} />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label htmlFor="signup-confirm-password" className="text-xs font-medium text-gray-200">Confirm Password</label>
                <div className="relative flex items-center">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    aria-invalid={Boolean(signupErrors.confirmPassword)}
                    aria-describedby={signupErrors.confirmPassword ? 'signup-confirm-password-error' : undefined}
                    placeholder="Confirm your password"
                    className={`w-full bg-neutral-950 border ${
                      signupErrors.confirmPassword ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                    } text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none`}
                    {...registerSignup('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <FormFieldError id="signup-confirm-password-error" error={signupErrors.confirmPassword?.message} />
              </div>

              {signupError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                  {signupError}
                </div>
              )}

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-2.5 px-4 mt-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg  active:scale-[0.99] disabled:opacity-50 font-sans"
              >
                {signupLoading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center my-1">
                <div className="grow border-t border-white/10"></div>
                <span className="shrink mx-3 text-xs text-gray-400 font-sans uppercase tracking-wider">or</span>
                <div className="grow border-t border-white/10"></div>
              </div>

              {/* Google OAuth Sign Up */}
              <GoogleSignInButton
                onClick={initiateGoogleLogin}
                disabled={signupLoading}
                text="Sign up with Google"
              />
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. FORGOT PASSWORD MODE (EXACT 2-STEP OTP IMPLEMENTATION)         */}
        {/* ================================================================= */}
        {mode === 'forgot' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pr-6">
              <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs text-gray-400 font-sans">
                {forgotStep === 1
                  ? 'Enter your registered email address to receive a 6-digit reset OTP.'
                  : `Enter the 6-digit code sent to ${forgotEmail} and choose a new password.`}
              </p>
            </div>

            {/* STEP 1: Enter Email & Send OTP */}
            {forgotStep === 1 ? (
              <form onSubmit={handleSendForgotOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="forgot-email-input" className="text-sm font-medium text-gray-200">Email Address</label>
                  <input
                    id="forgot-email-input"
                    type="email"
                    placeholder="Enter registered email"
                    value={forgotEmail}
                    aria-invalid={Boolean(forgotOtpError)}
                    aria-describedby={forgotOtpError ? 'forgot-email-error' : undefined}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotOtpError) setForgotOtpError('');
                    }}
                    className={`w-full bg-neutral-950 border ${
                      forgotOtpError ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                    } text-sm text-white placeholder-gray-500 px-3.5 py-2.5 rounded-lg outline-none transition-all`}
                  />
                  <FormFieldError id="forgot-email-error" error={forgotOtpError} />
                </div>

                <button
                  type="submit"
                  disabled={forgotOtpLoading || !forgotEmail.trim()}
                  className="w-full py-3 px-4 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg  active:scale-[0.99] disabled:opacity-50 font-sans"
                >
                  {forgotOtpLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Send Reset OTP</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      dispatch(setAuthModalMode('login'));
                    }}
                    className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left text-xs"></i>
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Verify OTP & Reset Password with Full Validation */
              <form onSubmit={handleVerifyForgotOtpAndReset} className="flex flex-col gap-3.5">
                {/* 6-Digit OTP */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="forgot-otp-input" className="text-xs font-semibold text-gray-200">6-Digit OTP Code *</label>
                  <input
                    id="forgot-otp-input"
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="e.g. 550865"
                    aria-invalid={Boolean(forgotCodeError)}
                    aria-describedby={forgotCodeError ? 'forgot-otp-error' : undefined}
                    value={forgotOtpCode}
                    onChange={(e) => {
                      setForgotOtpCode(e.target.value.replace(/\D/g, ''));
                      if (forgotCodeError) setForgotCodeError('');
                    }}
                    className={`w-full bg-neutral-950 border ${
                      forgotCodeError ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                    } text-base text-center tracking-widest font-mono text-white placeholder-gray-600 px-3 py-2 rounded-lg outline-none`}
                  />
                  <FormFieldError id="forgot-otp-error" error={forgotCodeError} />
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="forgot-new-password" className="text-xs font-semibold text-gray-200">New Password *</label>
                  <div className="relative flex items-center">
                    <input
                      id="forgot-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min 6 characters)"
                      aria-invalid={Boolean(forgotNewPasswordError)}
                      aria-describedby={forgotNewPasswordError ? 'forgot-new-password-error' : undefined}
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        if (forgotNewPasswordError) setForgotNewPasswordError('');
                      }}
                      className={`w-full bg-neutral-950 border ${
                        forgotNewPasswordError ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                      } text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <FormFieldError id="forgot-new-password-error" error={forgotNewPasswordError} />
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="forgot-confirm-password" className="text-xs font-semibold text-gray-200">Confirm New Password *</label>
                  <div className="relative flex items-center">
                    <input
                      id="forgot-confirm-password"
                      type={showNewConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      aria-invalid={Boolean(forgotConfirmPasswordError)}
                      aria-describedby={forgotConfirmPasswordError ? 'forgot-confirm-password-error' : undefined}
                      value={forgotConfirmPassword}
                      onChange={(e) => {
                        setForgotConfirmPassword(e.target.value);
                        if (forgotConfirmPasswordError) setForgotConfirmPasswordError('');
                      }}
                      className={`w-full bg-neutral-950 border ${
                        forgotConfirmPasswordError ? 'border-rose-500 focus:border-rose-500' : 'border-white/15 focus:border-neutral-600'
                      } text-xs text-white placeholder-gray-500 px-3 py-2 pr-9 rounded-lg outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                      className="absolute right-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                      aria-label={showNewConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      <i className={`fa-solid ${showNewConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <FormFieldError id="forgot-confirm-password-error" error={forgotConfirmPasswordError} />
                </div>

                {forgotOtpError && (
                  <div role="alert" className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                    {forgotOtpError}
                  </div>
                )}

                {/* Resend OTP Bar */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Didn't receive OTP?</span>
                  {forgotOtpTimer > 0 ? (
                    <span className="font-mono text-gray-400">
                      Resend in <strong className="text-neutral-300">{forgotOtpTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendForgotOtp}
                      disabled={forgotOtpLoading}
                      className="text-neutral-300 hover:underline font-bold cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotOtpLoading}
                  className="w-full py-2.5 px-4 mt-1 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-black font-extrabold text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg  active:scale-[0.99] disabled:opacity-50 font-sans"
                >
                  {forgotOtpLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin text-black"></i>
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left mr-1 text-xs"></i>
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      dispatch(setAuthModalMode('login'));
                    }}
                    className="text-neutral-300 hover:underline font-bold cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
        {cardElement}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center font-sans">
      {cardElement}
    </div>
  );
};

export default Login;
