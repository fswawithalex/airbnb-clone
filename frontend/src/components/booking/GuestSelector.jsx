export default function GuestSelector({
    guests,
    maxGuests,
    onChange
}) {
    const updateGuests = (amount) => {
        const nextValue = guests + amount;

        if (nextValue < 1 || nextValue > maxGuests) {
            return;
        }

        onChange(nextValue);
    };

    return (
        <div className="mt-5">
            <label className="mb-3 block text-sm font-medium">
                Guests
            </label>

            <div className="flex items-center justify-between rounded-lg border border-gray-300 p-3">

                <div>
                    <p>Guests</p>
                    <p className="text-sm text-gray-500">
                        Maximum {maxGuests} guests
                    </p>
                </div>

                <div className="flex items-center gap-4">

                    <button 
                        type="button"
                        onClick={() => updateGuests(-1)}
                        disabled={guests <= 1}
                        className="h-8 w-8 rounded-full border disabled:opacity-30"
                    >
                        -
                    </button>

                    <span className="min-w-4 text-center">
                        {guests}
                    </span>

                    <button
                        type="button"
                        onClick={() => updateGuests(1)}
                        disabled={guests >= maxGuests}
                        className="h-8 w-8 rounded-full border disabled:opacity-30"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}