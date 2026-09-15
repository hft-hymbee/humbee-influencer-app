/**
 * Typed param lists. Untyped navigation is where refactors break silently.
 */
import type { CreateDemandResult, OtpRequestResult } from '../api/types';

export type RootStackParamList = {
  Language: undefined;
  Login: undefined;
  /** No request_id in V2, but the OTP shape (length, resend window) rides along from request. */
  Otp: { mobile: string; request: OtpRequestResult };
  Tabs: undefined;
  Profile: undefined;
  Notifications: undefined;
  /** Screen 07 REPLACES the demand screen and hides the nav — the two buttons are the only exits. */
  DemandCaptured: { result: CreateDemandResult | null };
};

export type TabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Demand: undefined;
  Allocation: undefined;
  Rewards: undefined;
};
