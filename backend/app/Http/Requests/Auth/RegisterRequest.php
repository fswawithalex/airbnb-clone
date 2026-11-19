<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Airbnb-style "Finish signing up": legal name, birth date (18+), email, password. */
class RegisterRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'birth_date' => ['required', 'date', 'after:1900-01-01', 'before_or_equal:'.now()->subYears(18)->toDateString()],
            // Soft-deleted users still own their email: it stays unique in the table.
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:30'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'birth_date.before_or_equal' => __('You need to be at least 18 to sign up.'),
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(array_filter([
            'email' => is_string($this->email) ? strtolower(trim($this->email)) : null,
            'first_name' => is_string($this->first_name) ? trim($this->first_name) : null,
            'last_name' => is_string($this->last_name) ? trim($this->last_name) : null,
        ], fn ($value) => $value !== null));
    }
}
