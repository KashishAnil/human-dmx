import { createSlice } from "@reduxjs/toolkit";

/**
 * Cart *contents* live on the server (see `api.getCart`) so pricing and stock
 * can't be tampered with client-side. What's left here is presentation state
 * the server has no opinion about: whether the drawer is open.
 */
interface CartUiState {
  drawerOpen: boolean;
}

const initialState: CartUiState = {
  drawerOpen: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    openCart: (state) => {
      state.drawerOpen = true;
    },
    closeCart: (state) => {
      state.drawerOpen = false;
    },
  },
});

export const { openCart, closeCart } = cartSlice.actions;

export default cartSlice.reducer;
