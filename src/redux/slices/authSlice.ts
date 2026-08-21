import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadState, saveState } from "../persist";
import type { AuthPayload, AuthUser } from "../services/api";

/**
 * Holds the signed-in session. The merchant portal gates on `user.role`, and
 * the tokens are attached to every request by the API layer's base query.
 *
 * Replaces the old hard-coded DEMO_ADMIN check — the portal now authenticates
 * against `POST /auth/login` like any other client.
 */
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = loadState<AuthState>("auth", {
  user: null,
  accessToken: null,
  refreshToken: null,
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthPayload>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      saveState("auth", state);
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      saveState("auth", state);
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;

export default authSlice.reducer;
