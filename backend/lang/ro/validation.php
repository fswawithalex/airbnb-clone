<?php

// Only the rules our forms use. Anything missing falls back to lang/en/validation.php.
return [
    'after' => 'Câmpul :attribute trebuie să fie o dată după :date.',
    'before_or_equal' => 'Câmpul :attribute trebuie să fie o dată înainte sau egală cu :date.',
    'confirmed' => 'Confirmarea pentru :attribute nu se potrivește.',
    'current_password' => 'Parola este incorectă.',
    'date' => 'Câmpul :attribute nu este o dată validă.',
    'different' => 'Câmpurile :attribute și :other trebuie să fie diferite.',
    'email' => 'Câmpul :attribute trebuie să fie o adresă de email validă.',
    'enum' => 'Valoarea selectată pentru :attribute nu este validă.',
    'image' => 'Câmpul :attribute trebuie să fie o imagine.',
    'in' => 'Valoarea selectată pentru :attribute nu este validă.',
    'integer' => 'Câmpul :attribute trebuie să fie un număr întreg.',
    'lowercase' => 'Câmpul :attribute trebuie scris cu litere mici.',
    'max' => [
        'file' => 'Câmpul :attribute nu poate depăși :max kilobytes.',
        'numeric' => 'Câmpul :attribute nu poate fi mai mare de :max.',
        'string' => 'Câmpul :attribute nu poate avea mai mult de :max caractere.',
    ],
    'mimes' => 'Câmpul :attribute trebuie să fie un fișier de tipul: :values.',
    'min' => [
        'numeric' => 'Câmpul :attribute trebuie să fie cel puțin :min.',
        'string' => 'Câmpul :attribute trebuie să aibă cel puțin :min caractere.',
    ],
    'password' => [
        'letters' => 'Câmpul :attribute trebuie să conțină cel puțin o literă.',
        'mixed' => 'Câmpul :attribute trebuie să conțină cel puțin o literă mare și una mică.',
        'numbers' => 'Câmpul :attribute trebuie să conțină cel puțin o cifră.',
        'symbols' => 'Câmpul :attribute trebuie să conțină cel puțin un simbol.',
        'uncompromised' => 'Această :attribute a apărut într-o scurgere de date. Alege alta.',
    ],
    'required' => 'Câmpul :attribute este obligatoriu.',
    'string' => 'Câmpul :attribute trebuie să fie text.',
    'unique' => 'Acest :attribute este deja folosit.',
    'uploaded' => 'Încărcarea câmpului :attribute a eșuat.',

    'attributes' => [
        'first_name' => 'prenume',
        'last_name' => 'nume',
        'name' => 'nume',
        'birth_date' => 'data nașterii',
        'email' => 'email',
        'phone' => 'telefon',
        'password' => 'parolă',
        'password_confirmation' => 'confirmare parolă',
        'current_password' => 'parola actuală',
        'avatar' => 'fotografie',
        'role' => 'rol',
        'token' => 'token',
    ],
];
