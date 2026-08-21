import { useState } from "react";
import { Link } from "react-router";
import type { Product } from "../../types";
import {
  cn,
  isSoldOut,
  money,
  resolveImage,
  totalStock,
} from "../../utils/Functions";
import { Badge, Stars } from "../ui/Bits";
import { useAppDispatch } from "../../redux/hooks";
import { openCart } from "../../redux/slices/cartSlice";
import { useAddToCartMutation } from "../../redux/services/api";
import { useCategoryLabel } from "../../hooks/useCommerce";

const ProductCard = ({ product }: { product: Product }) => {
  const dispatch = useAppDispatch();
  const categoryLabel = useCategoryLabel();
  const [addToCart] = useAddToCartMutation();
  const [hovered, setHovered] = useState(false);

  const soldOut = isSoldOut(product);
  const stock = totalStock(product);
  const hasAlt = product.images.length > 1;
  const onSale =
    product.compareAt !== null && product.compareAt > product.price;
  const oneSize = product.variants.length === 1;

  /**
   * The server caps quantity against live stock and returns the repriced
   * cart, so the drawer only opens once the line is actually on the cart.
   */
  const add = async (size: string) => {
    try {
      await addToCart({ productId: product.id, size }).unwrap();
      dispatch(openCart());
    } catch {
      /* sold out from under us — the next catalog refetch reflects it */
    }
  };

  const quickAdd = () => {
    const firstInStock = product.variants.find((v) => v.stock > 0);
    if (firstInStock) add(firstInStock.size);
  };

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_24px_50px_-30px_rgba(11,17,32,0.45)]"
    >
      <Link to={`/product/${product.slug}`} className="relative block">
        <div className="relative aspect-4/5 w-full overflow-hidden bg-card">
          <img
            src={resolveImage(product.images[0])}
            alt={product.name}
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full object-contain p-4 transition-all duration-700",
              hovered && hasAlt
                ? "scale-105 opacity-0"
                : "scale-100 opacity-100",
              soldOut && "grayscale",
            )}
          />
          {hasAlt && (
            <img
              src={resolveImage(product.images[1])}
              alt=""
              loading="lazy"
              aria-hidden
              className={cn(
                "absolute inset-0 h-full w-full object-contain p-4 transition-all duration-700",
                hovered ? "scale-105 opacity-100" : "scale-100 opacity-0",
              )}
            />
          )}
        </div>

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.badge && <Badge tone="gold">{product.badge}</Badge>}
          {onSale && (
            <Badge tone="coral">
              Save {money(product.compareAt! - product.price)}
            </Badge>
          )}
          {soldOut && <Badge tone="muted">Sold Out</Badge>}
          {!soldOut && stock <= 6 && (
            <Badge tone="royal">Only {stock} left</Badge>
          )}
        </div>

        <span className="absolute right-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-body backdrop-blur">
          {product.collection}
        </span>
      </Link>

      {/* quick add slides up over the image */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-3 z-10 transition-all duration-300",
          "bottom-[8.75rem]",
          hovered && !soldOut
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "translate-y-3 opacity-0",
        )}
      >
        {oneSize ? (
          <button
            type="button"
            onClick={quickAdd}
            className="w-full rounded-full bg-ink px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-bone shadow-lg transition hover:bg-royal"
          >
            Quick Add · {money(product.price)}
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-ink/92 p-1.5 shadow-lg backdrop-blur">
            {product.variants.map((v) => (
              <button
                key={v.size}
                type="button"
                disabled={v.stock === 0}
                onClick={() => add(v.size)}
                className={cn(
                  "flex-1 rounded-full py-2 text-[11px] font-bold uppercase transition",
                  v.stock === 0
                    ? "text-white/25 line-through"
                    : "text-bone hover:bg-gold hover:text-head",
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow-type text-soft">
          {categoryLabel(product.category)}
        </p>
        <h3 className="mt-2">
          <Link
            to={`/product/${product.slug}`}
            className="display text-lg leading-tight text-head transition hover:text-royal"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-1 text-xs text-body">{product.blurb}</p>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
          <div className="flex items-baseline gap-2">
            <span className="display text-xl text-head">
              {money(product.price)}
            </span>
            {onSale && (
              <span className="text-xs text-soft line-through">
                {money(product.compareAt!)}
              </span>
            )}
          </div>
          <Stars rating={product.rating} count={product.reviewCount} />
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
