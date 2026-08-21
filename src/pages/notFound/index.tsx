import { useEffect } from "react";
import { LinkButton } from "../../components/ui/Button";
import { Eyebrow } from "../../components/ui/Bits";

const NotFound = () => {
  useEffect(() => {
    document.title = "Not Found — HUMAN DMX APPAREL";
  }, []);

  return (
    <div className="container-x flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <Eyebrow>Error 404</Eyebrow>
      <h1 className="display mt-6 text-[clamp(5rem,20vw,12rem)] leading-none text-head">
        86'd
      </h1>
      <p className="mt-4 max-w-md text-sm text-body">
        That page isn't here. It either sold out, moved, or never existed in the
        first place.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <LinkButton to="/" size="lg">
          Back Home
        </LinkButton>
        <LinkButton to="/shop" size="lg" variant="outline">
          Shop The Drop
        </LinkButton>
      </div>
    </div>
  );
};

export default NotFound;
