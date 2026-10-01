-- Used at checkout only when the delivery ZIP is not in the Avalara table.

insert into public.country_tax_rates (country_code, rate_percent)
values ('US', 8.25)
on conflict (country_code) do nothing;
