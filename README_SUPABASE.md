# Integrasi Supabase

Proyek ini telah dimigrasikan sepenuhnya untuk menggunakan Supabase sebagai backend database, menggantikan `localStorage`.

## Setup

1.  Buat proyek baru di [Supabase](https://supabase.com/).
2.  Salin URL dan Anon Key dari dashboard Supabase.
3.  Buat file `.env` di root proyek dan tambahkan variabel berikut:

    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

## Skema Database

Jalankan perintah SQL berikut di SQL Editor Supabase untuk membuat tabel yang diperlukan:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (Teachers & Students)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text check (role in ('teacher', 'student', 'admin')) not null,
  name text not null,
  school_name text,
  class_name text,
  subject text,
  photo_url text,
  learning_style text,
  unlocked_achievements text[] default '{}',
  is_active boolean default true,
  joined_at bigint default (extract(epoch from now()) * 1000)
);

-- 2. Questions
create table questions (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references profiles(id) on delete cascade not null,
  topic text not null,
  indicator text,
  difficulty text check (difficulty in ('Mudah', 'Sedang', 'Sulit')) not null,
  text text not null,
  image_url text,
  options text[] not null,
  correct_index int not null,
  explanation text,
  created_at bigint default (extract(epoch from now()) * 1000)
);

-- 3. Packets
create table packets (
  id text primary key, -- Custom ID like FIS-1234
  teacher_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  questions jsonb not null, -- Array of Question objects
  modules jsonb, -- PacketModules structure
  learning_materials jsonb, -- Array of LearningMaterial objects
  differentiation_mode text default 'content',
  created_at bigint default (extract(epoch from now()) * 1000)
);

-- 4. Results
create table results (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  packet_id text references packets(id) on delete cascade not null,
  score int not null,
  ability_level text,
  answers boolean[] not null,
  selected_indices int[] default '{}',
  attempt_number int default 1,
  timestamp bigint default (extract(epoch from now()) * 1000)
);

-- 5. Achievements
create table achievements (
  id text primary key,
  title text not null,
  description text not null,
  type text not null,
  target_value int not null,
  icon_url text
);
```

## Migrasi Kode

Semua logika CRUD telah dipindahkan ke `src/services/supabaseService.ts`.
`StorageService` (localStorage) telah dihapus.

### Contoh Penggunaan SupabaseService

```typescript
import { SupabaseService } from '../services/supabaseService';

// Mengambil semua soal
const questions = await SupabaseService.getQuestions();

// Menyimpan hasil kuis
await SupabaseService.saveResult(newResult);
```

## Catatan Penting

-   **Authentication:** Aplikasi menggunakan tabel `profiles` kustom yang terhubung dengan `auth.users` Supabase (jika menggunakan Supabase Auth penuh) atau dikelola secara manual di tabel `profiles` untuk kesederhanaan saat ini.
-   **Row Level Security (RLS):** Saat ini RLS belum diaktifkan secara ketat. Disarankan untuk mengaktifkan RLS di produksi untuk keamanan data.
-   **Storage:** Upload gambar (soal, profil) saat ini masih menggunakan Base64 string yang disimpan di database. Untuk produksi, disarankan menggunakan Supabase Storage buckets.
