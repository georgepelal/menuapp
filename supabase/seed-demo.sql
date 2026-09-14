-- Seeds the public demo menu shown by the landing page's "Try the Demo" /
-- "View Demo" buttons (linked to /m/coastal-breeze).
--
-- Prerequisite (manual, one-time): register a real account through the app
-- UI with business name "Coastal Breeze" — that generates the business row
-- and its slug ("coastal-breeze") via the normal signup flow. Only after
-- that account exists should you run this script in the Supabase SQL Editor.
-- Safe to re-run: it clears any previous demo categories/items first.

do $$
declare
  v_business_id uuid;
  v_best_sellers uuid;
  v_brunch uuid;
  v_cocktails uuid;
begin
  select id into v_business_id from businesses where slug = 'coastal-breeze';

  if v_business_id is null then
    raise exception 'No business with slug ''coastal-breeze'' found. Register that account through the app first.';
  end if;

  update businesses set
    description = 'Artisan coffee, fresh pastries, and sunset cocktails by the sea.',
    currency = '€',
    theme_color = '#0ea5e9',
    theme_template = 'modern',
    primary_language = 'en',
    languages = '[{"code":"en","name":"English","flag":"🇺🇸"},{"code":"el","name":"Greek","flag":"🇬🇷"}]'::jsonb,
    enable_smart_waiter = true,
    enable_lead_capture = true,
    enable_feedback = true,
    is_published = true
  where id = v_business_id;

  delete from menu_items where business_id = v_business_id;
  delete from categories where business_id = v_business_id;

  insert into categories (id, business_id, name, sort_order) values
    (gen_random_uuid(), v_business_id, 'Best Sellers', 0),
    (gen_random_uuid(), v_business_id, 'Brunch', 1),
    (gen_random_uuid(), v_business_id, 'Cocktails', 2);

  select id into v_best_sellers from categories where business_id = v_business_id and name = 'Best Sellers';
  select id into v_brunch from categories where business_id = v_business_id and name = 'Brunch';
  select id into v_cocktails from categories where business_id = v_business_id and name = 'Cocktails';

  insert into menu_items (business_id, category_id, name, description, price, image_url, dietary, is_available) values
    (v_business_id, v_best_sellers, 'Freddo Espresso',
     'Double espresso blended with ice, served cold and frothy. The Greek summer staple.',
     3.5, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=300&q=80',
     array['VG','GF'], true),
    (v_business_id, v_brunch, 'Avocado Toast',
     'Sourdough bread topped with smashed avocado, chili flakes, and lime zest.',
     9, 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=300&q=80',
     array['VG'], true),
    (v_business_id, v_cocktails, 'Aperol Spritz',
     'Refreshing Prosecco, Aperol, and soda water garnished with an orange slice.',
     11, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80',
     array['VG','GF'], true);
end $$;
