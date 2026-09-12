import { useFavourites } from '../hooks/useFavourites';

export default function FavouriteButton({ adId, className = '' }) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const active = isFavourite(adId);

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavourite(adId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? 'Remove from favourites' : 'Add to favourites'}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-primary shadow transition hover:scale-110 hover:bg-white ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.716-4.35-9.428-8.06C.665 10.128 1.1 6.5 4.11 4.99c2.19-1.1 4.61-.4 5.89 1.36C11.28 4.59 13.7 3.89 15.89 4.99c3.01 1.51 3.445 5.14 1.538 7.95C18.716 16.65 12 21 12 21z"
        />
      </svg>
    </button>
  );
}
