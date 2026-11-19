import { todayISO } from '../../lib/dates.js';

export default function DateRangePicker({
    checkIn,
    checkOut,
    onCheckInChange,
    onCheckOutChange
}) {
    const getNextDay = (date) => {
        const next = new Date(`${date}T00:00:00`);
        next.setDate(next.getDate() + 1);

        return [
            next.getFullYear(),
            String(next.getMonth() + 1).padStart(2, '0'),
            String(next.getDate()).padStart(2, '0')
        ].join('-');
    };

    const minCheckOut = checkIn ? getNextDay(checkIn) : getNextDay(todayISO());

    const handleCheckInChange = (value) => {
        onCheckInChange(value);

        // Reset checkout if it is no longer valid
        if (checkOut && checkOut <= value) {
            onCheckOutChange('');
        }
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="mb-2 block text-sm font-medium">
                    Check-in
                </label>

                <input 
                    type="date"
                    min={todayISO()}
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium">
                    Check-out
                </label>

                <input 
                    type="date"
                    min={minCheckOut}
                    value={checkOut}
                    disabled={!checkOut}
                    onChange={(e) => onCheckOutChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm disabled:bg-gray-100"
                />
            </div>
        </div>
    );
}