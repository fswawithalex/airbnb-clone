<?php

// Only the rules our forms use. Anything missing falls back to lang/en/validation.php.
return [
    'after' => 'Поле :attribute должно быть датой после :date.',
    'before_or_equal' => 'Поле :attribute должно быть датой не позже :date.',
    'confirmed' => 'Поле :attribute не совпадает с подтверждением.',
    'current_password' => 'Неверный пароль.',
    'date' => 'Поле :attribute не является датой.',
    'different' => 'Поля :attribute и :other должны различаться.',
    'email' => 'Поле :attribute должно быть действительным email-адресом.',
    'enum' => 'Выбранное значение для :attribute некорректно.',
    'image' => 'Поле :attribute должно быть изображением.',
    'in' => 'Выбранное значение для :attribute некорректно.',
    'integer' => 'Поле :attribute должно быть целым числом.',
    'lowercase' => 'Поле :attribute должно быть в нижнем регистре.',
    'max' => [
        'file' => 'Размер файла :attribute не может быть больше :max КБ.',
        'numeric' => 'Поле :attribute не может быть больше :max.',
        'string' => 'Поле :attribute не может быть длиннее :max символов.',
    ],
    'mimes' => 'Поле :attribute должно быть файлом одного из типов: :values.',
    'min' => [
        'numeric' => 'Поле :attribute должно быть не меньше :min.',
        'string' => 'Поле :attribute должно содержать не менее :min символов.',
    ],
    'password' => [
        'letters' => 'Поле :attribute должно содержать хотя бы одну букву.',
        'mixed' => 'Поле :attribute должно содержать хотя бы одну заглавную и одну строчную букву.',
        'numbers' => 'Поле :attribute должно содержать хотя бы одну цифру.',
        'symbols' => 'Поле :attribute должно содержать хотя бы один символ.',
        'uncompromised' => 'Этот :attribute обнаружен в утечке данных. Выберите другой.',
    ],
    'required' => 'Поле :attribute обязательно.',
    'string' => 'Поле :attribute должно быть строкой.',
    'unique' => 'Такой :attribute уже используется.',
    'uploaded' => 'Не удалось загрузить :attribute.',

    'attributes' => [
        'first_name' => 'имя',
        'last_name' => 'фамилия',
        'name' => 'имя',
        'birth_date' => 'дата рождения',
        'email' => 'email',
        'phone' => 'телефон',
        'password' => 'пароль',
        'password_confirmation' => 'подтверждение пароля',
        'current_password' => 'текущий пароль',
        'avatar' => 'фото',
        'role' => 'роль',
        'token' => 'токен',
    ],
];
