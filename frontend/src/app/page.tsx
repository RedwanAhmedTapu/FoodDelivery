"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  ArrowRight,
  Star,
  History,
  Sparkles,
  Loader2,
  Store as StoreIcon,
  Utensils,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { storesApi } from "@/lib/endpoints/stores";
import { categoriesApi } from "@/lib/endpoints/categories";
import { recommendationsApi } from "@/lib/endpoints/misc";
import { ordersApi } from "@/lib/endpoints/orders";
import { foodsApi } from "@/lib/endpoints/foods";

import { Store, FoodCategory, Food } from "@/types";
import { StoreCard } from "@/components/store/StoreCard";
import { Spinner } from "@/components/ui/Primitives";
import {
  getCurrentPosition,
  formatCurrency,
} from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

/* =========================================================
   FOOD STRIP
========================================================= */

function FoodStrip({
  title,
  icon: Icon,
  foods,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  foods: Food[];
}) {
  if (foods.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-paper">
        <Icon className="h-5 w-5 text-mango" />
        {title}
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {foods.map((food) => {
          const store =
            typeof food.storeId === "object"
              ? (food.storeId as Store)
              : null;

          const price =
            food.discountPrice != null &&
            food.discountPrice < food.price
              ? food.discountPrice
              : food.price;

          return (
            <Link
              key={food._id}
              href={
                store
                  ? `/stores/${store.slug}`
                  : "/stores"
              }
              className="ticket-notch w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-ticket transition-transform hover:-translate-y-1"
            >
              <div className="relative h-28 w-full bg-surface">
                {food.images?.[0]?.url ? (
                  <Image
                    src={food.images[0].url}
                    alt={food.name}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-xl text-faint">
                    {food.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="truncate text-sm font-medium text-paper">
                  {food.name}
                </p>

                <p className="truncate text-xs text-faint">
                  {store?.name}
                </p>

                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-paper">
                    {formatCurrency(price)}
                  </span>

                  {food.rating > 0 && (
                    <span className="flex items-center gap-0.5 font-mono text-[11px] text-mango">
                      <Star className="h-3 w-3 fill-mango" />
                      {food.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   SEARCH SUGGESTION TYPES
========================================================= */

type SearchSuggestions = {
  foods: Food[];
  stores: Store[];
};

/* =========================================================
   HOME PAGE
========================================================= */

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  /* -------------------------------------------------------
     HOME DATA
  ------------------------------------------------------- */

  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] =
    useState<FoodCategory[]>([]);

  const [recommendedFoods, setRecommendedFoods] =
    useState<Food[]>([]);

  const [recentFoods, setRecentFoods] =
    useState<Food[]>([]);

  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  const [query, setQuery] = useState("");

  const [suggestions, setSuggestions] =
    useState<SearchSuggestions>({
      foods: [],
      stores: [],
    });

  const [isSearching, setIsSearching] =
    useState(false);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  const [isLoading, setIsLoading] =
    useState(true);

  const [locationLabel, setLocationLabel] =
    useState("Dhaka, Bangladesh");

  /* =======================================================
     INITIAL HOME DATA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [cats] =
          await Promise.all([
            categoriesApi.listActive(),
          ]);

        if (!mounted) return;

        setCategories(cats);

        try {
          const { coords } =
            await getCurrentPosition();

          const { items } =
            await storesApi.nearby(
              coords[0],
              coords[1],
              8,
            );

          if (!mounted) return;

          setStores(items);
          setLocationLabel("Near you");
        } catch {
          const { items } =
            await storesApi.list({
              limit: 8,
            });

          if (!mounted) return;

          setStores(items);
        }
      } catch {
        // Keep the page usable even if one initial API fails.
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     PERSONALIZED DATA
  ======================================================= */

  useEffect(() => {
    if (
      !user ||
      user.role !== "CUSTOMER"
    ) {
      return;
    }

    recommendationsApi
      .foods(8)
      .then(setRecommendedFoods)
      .catch(() => {});

    ordersApi
      .mine({ limit: 20 })
      .then(async ({ items }) => {
        const frequency =
          new Map<string, number>();

        const lastOrdered =
          new Map<string, number>();

        items
          .filter(
            (o) =>
              o.orderStatus ===
              "DELIVERED",
          )
          .forEach((order) => {
            const orderedAt =
              new Date(
                order.createdAt,
              ).getTime();

            order.items.forEach(
              (item) => {
                frequency.set(
                  item.foodId,
                  (frequency.get(
                    item.foodId,
                  ) || 0) +
                    item.quantity,
                );

                if (
                  !lastOrdered.has(
                    item.foodId,
                  ) ||
                  orderedAt >
                    lastOrdered.get(
                      item.foodId,
                    )!
                ) {
                  lastOrdered.set(
                    item.foodId,
                    orderedAt,
                  );
                }
              },
            );
          });

        const topFoodIds =
          [...frequency.keys()]
            .sort(
              (a, b) =>
                frequency.get(b)! -
                  frequency.get(a)! ||
                lastOrdered.get(b)! -
                  lastOrdered.get(a)!,
            )
            .slice(0, 8);

        if (
          topFoodIds.length === 0
        ) {
          return;
        }

        const resolved =
          await Promise.all(
            topFoodIds.map((id) =>
              foodsApi
                .getById(id)
                .catch(() => null),
            ),
          );

        setRecentFoods(
          resolved.filter(
            (f): f is Food =>
              f !== null &&
              f.isActive,
          ),
        );
      })
      .catch(() => {});
  }, [user]);

  /* =======================================================
     SEARCH AUTOCOMPLETE
  ======================================================= */

  useEffect(() => {
    const trimmed =
      query.trim();

    /*
     * Don't search until at least 2 characters.
     */
    if (trimmed.length < 2) {
      setSuggestions({
        foods: [],
        stores: [],
      });

      setIsSearching(false);
      return;
    }

    setShowSuggestions(true);
    setIsSearching(true);

    /*
     * Debounce API request.
     */
    const timer = window.setTimeout(
      async () => {
        try {
          /*
           * Run food + store searches
           * simultaneously.
           */
          const [foodResult, storeResult] =
            await Promise.all([
              foodsApi.search({
                search: trimmed,
                limit: 5,
              }),

              storesApi.list({
                search: trimmed,
                limit: 5,
              }),
            ]);

          setSuggestions({
            foods: foodResult.items || [],
            stores: storeResult.items || [],
          });
        } catch {
          setSuggestions({
            foods: [],
            stores: [],
          });
        } finally {
          setIsSearching(false);
        }
      },
      300,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  /* =======================================================
     CLOSE SEARCH DROPDOWN ON OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target as Node,
        )
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setShowSuggestions(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  /* =======================================================
     SEARCH SUBMIT
  ======================================================= */

  function handleSearch(
    e: FormEvent,
  ) {
    e.preventDefault();

    const trimmed =
      query.trim();

    if (!trimmed) {
      router.push("/stores");
      return;
    }

    setShowSuggestions(false);

    router.push(
      `/stores?search=${encodeURIComponent(
        trimmed,
      )}`,
    );
  }

  /* =======================================================
     FOOD CLICK
  ======================================================= */

  function handleFoodClick(
    food: Food,
  ) {
    setShowSuggestions(false);

    const store =
      typeof food.storeId ===
      "object"
        ? (food.storeId as Store)
        : null;

    /*
     * Your current food detail route
     * isn't provided in the code.
     *
     * So navigate to the store that
     * contains this food.
     */
    if (store?.slug) {
      router.push(
        `/stores/${store.slug}`,
      );
      return;
    }

    router.push("/stores");
  }

  /* =======================================================
     STORE CLICK
  ======================================================= */

  function handleStoreClick(
    store: Store,
  ) {
    setShowSuggestions(false);

    router.push(
      `/stores/${store.slug}`,
    );
  }

  /* =======================================================
     SEARCH RESULT COUNT
  ======================================================= */

  const hasResults =
    suggestions.foods.length > 0 ||
    suggestions.stores.length > 0;

  const shouldShowDropdown =
    showSuggestions &&
    query.trim().length >= 2;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div>
      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative overflow-visible border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-mango">
            <MapPin className="h-3.5 w-3.5" />
            {locationLabel}
          </p>

          <h1 className="max-w-2xl font-display text-4xl font-medium leading-[1.1] text-paper md:text-6xl">
            Your city's best kitchens,{" "}
            <span className="text-mango">
              tracked door to door.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-muted">
            Order from local stores, watch
            your rider's route in real time,
            and earn points every time you
            eat.
          </p>

          {/* =================================================
              SEARCH BOX
          ================================================= */}

          <div
            ref={searchRef}
            className="relative z-50 mt-8 max-w-lg"
          >
            <form
              onSubmit={handleSearch}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />

                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(
                      e.target.value,
                    );
                    setShowSuggestions(
                      e.target.value.trim()
                        .length >= 2,
                    );
                  }}
                  onFocus={() => {
                    if (
                      query.trim()
                        .length >= 2
                    ) {
                      setShowSuggestions(
                        true,
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Escape"
                    ) {
                      setShowSuggestions(
                        false,
                      );
                    }
                  }}
                  placeholder="Search biryani, burgers, stores..."
                  autoComplete="off"
                  className="h-12 w-full rounded-full border border-border bg-surface py-3 pl-10 pr-10 text-sm text-paper placeholder:text-faint focus:border-mango focus:outline-none"
                />

                {/* Clear */}
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSuggestions({
                        foods: [],
                        stores: [],
                      });
                      setShowSuggestions(
                        false,
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-faint hover:text-paper"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-mango px-5 text-sm font-medium text-base transition-opacity hover:opacity-90"
              >
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* =================================================
                AUTOCOMPLETE DROPDOWN
            ================================================= */}

            {shouldShowDropdown && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                {/* Loading */}
                {isSearching && (
                  <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-mango" />
                    Searching...
                  </div>
                )}

                {/* Results */}
                {!isSearching &&
                  hasResults && (
                    <div className="max-h-[480px] overflow-y-auto">
                      {/* ===============================
                          FOODS
                      =============================== */}

                      {suggestions.foods
                        .length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                            <Utensils className="h-4 w-4 text-mango" />

                            <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                              Foods
                            </span>
                          </div>

                          <div className="p-2">
                            {suggestions.foods.map(
                              (food) => {
                                const store =
                                  typeof food.storeId ===
                                  "object"
                                    ? (food.storeId as Store)
                                    : null;

                                const price =
                                  food.discountPrice !=
                                    null &&
                                  food.discountPrice <
                                    food.price
                                    ? food.discountPrice
                                    : food.price;

                                return (
                                  <button
                                    type="button"
                                    key={food._id}
                                    onClick={() =>
                                      handleFoodClick(
                                        food,
                                      )
                                    }
                                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface"
                                  >
                                    {/* Food image */}
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                                      {food
                                        .images?.[0]
                                        ?.url ? (
                                        <Image
                                          src={
                                            food
                                              .images[0]
                                              .url
                                          }
                                          alt={
                                            food.name
                                          }
                                          fill
                                          className="object-cover"
                                          sizes="56px"
                                        />
                                      ) : (
                                        <div className="flex h-full items-center justify-center font-display text-lg text-faint">
                                          {food.name
                                            .slice(
                                              0,
                                              1,
                                            )
                                            .toUpperCase()}
                                        </div>
                                      )}
                                    </div>

                                    {/* Food information */}
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-paper">
                                        {food.name}
                                      </p>

                                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-faint">
                                        {store?.name ||
                                          "Store"}
                                      </p>

                                      <div className="mt-1 flex items-center gap-3">
                                        <span className="font-mono text-xs text-paper">
                                          {formatCurrency(
                                            price,
                                          )}
                                        </span>

                                        {food.rating >
                                          0 && (
                                          <span className="flex items-center gap-0.5 text-[11px] text-mango">
                                            <Star className="h-3 w-3 fill-mango" />
                                            {food.rating.toFixed(
                                              1,
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                      {/* ===============================
                          STORES
                      =============================== */}

                      {suggestions.stores
                        .length > 0 && (
                        <div className="border-t border-border">
                          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                            <StoreIcon className="h-4 w-4 text-mango" />

                            <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                              Stores
                            </span>
                          </div>

                          <div className="p-2">
                            {suggestions.stores.map(
                              (store) => (
                                <button
                                  type="button"
                                  key={store._id}
                                  onClick={() =>
                                    handleStoreClick(
                                      store,
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface"
                                >
                                  {/* Store image */}
                                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                                    {store.logo?.url ? (
                                      <Image
                                        src={
                                          store.logo
                                            .url
                                        }
                                        alt={
                                          store.name
                                        }
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                      />
                                    ) : store.cover?.url ? (
                                      <Image
                                        src={
                                          store.cover
                                            .url
                                        }
                                        alt={
                                          store.name
                                        }
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center font-display text-lg text-mango">
                                        {store.name
                                          .slice(
                                            0,
                                            2,
                                          )
                                          .toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                  {/* Store information */}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-paper">
                                      {store.name}
                                    </p>

                                    {store.rating >
                                      0 && (
                                      <div className="mt-1 flex items-center gap-1 text-xs text-mango">
                                        <Star className="h-3 w-3 fill-mango" />
                                        <span>
                                          {store.rating.toFixed(
                                            1,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Full results */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowSuggestions(
                            false,
                          );
                          router.push(
                            `/stores?search=${encodeURIComponent(
                              query.trim(),
                            )}`,
                          );
                        }}
                        className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-mango hover:bg-surface"
                      >
                        View all results
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                {/* No results */}
                {!isSearching &&
                  !hasResults && (
                    <div className="px-4 py-8 text-center">
                      <Search className="mx-auto h-6 w-6 text-faint" />

                      <p className="mt-2 text-sm text-paper">
                        No results found
                      </p>

                      <p className="mt-1 text-xs text-faint">
                        Try another food or
                        store name.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-4 md:px-6">
          <h2 className="mb-6 font-display text-xl text-paper">
            What's on your mind?
          </h2>

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/stores?categoryId=${cat._id}`}
                className="group flex shrink-0 flex-col items-center gap-2"
              >
                <div className="relative h-[72px] w-[72px] rounded-full border-2 border-border bg-surface p-1 transition-all duration-200 group-hover:border-mango group-hover:shadow-[0_0_20px_rgba(255,159,28,0.15)] md:h-[84px] md:w-[84px]">
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    {cat.image?.url ? (
                      <Image
                        src={cat.image.url}
                        alt={cat.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="84px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-mango/20 to-mango/5 font-display text-lg font-medium text-mango">
                        {cat.name
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <span className="max-w-[80px] text-center text-xs font-medium leading-tight text-paper transition-colors group-hover:text-mango md:max-w-[90px] md:text-[13px]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          PERSONALIZED
      ===================================================== */}

      <FoodStrip
        title="Picked for you"
        icon={Sparkles}
        foods={recommendedFoods}
      />

      <FoodStrip
        title="Order this again"
        icon={History}
        foods={recentFoods}
      />

      {/* =====================================================
          STORES
      ===================================================== */}

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-paper">
            Stores {locationLabel}
          </h2>

          <Link
            href="/stores"
            className="text-sm text-mango hover:underline"
          >
            See all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : stores.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((store) => (
              <StoreCard
                key={store._id}
                store={store}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <StoreIcon className="mx-auto h-8 w-8 text-faint" />
            <p className="mt-3 text-sm text-muted">
              No stores found nearby.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}