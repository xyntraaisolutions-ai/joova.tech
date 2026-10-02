-- Private store for the latest Avalara CSV folder. Service role writes the files.

insert into storage.buckets (id, name, public)
values ('tax-rates', 'tax-rates', false)
on conflict (id) do nothing;
