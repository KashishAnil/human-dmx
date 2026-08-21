import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./services/api";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";

/**
 * Products, orders, carts, promos and settings are all server state now, held
 * in the RTK Query cache rather than in slices persisted to localStorage.
 * What remains local is the session (persisted inside `authSlice`) and the
 * cart drawer's open/closed flag.
 */
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Enables refetchOnFocus / refetchOnReconnect behaviour.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
