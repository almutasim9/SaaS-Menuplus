-- Optimized Analytics RPC for MenuPlus
-- This function aggregates metrics on the database side for maximum performance.

CREATE OR REPLACE FUNCTION get_dashboard_analytics(
    p_restaurant_id UUID, 
    p_start_date TIMESTAMP DEFAULT NULL, 
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_total_orders INT;
    v_total_revenue NUMERIC;
    v_top_products JSON;
    v_daily_data JSON;
    v_conversion_rates JSON;
    v_start TIMESTAMP;
    v_end TIMESTAMP;
    v_chart_start DATE;
    v_chart_end DATE;
BEGIN
    -- 1. Determine the effective time range
    v_start := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '6 days');
    v_end := COALESCE(p_end_date, CURRENT_TIMESTAMP);
    
    -- Chart range logic: if it's the default (7 days) or a custom range
    v_chart_start := v_start::DATE;
    v_chart_end := v_end::DATE;

    -- 2. Total Orders & Revenue (Filtered)
    SELECT 
        COUNT(*), 
        COALESCE(SUM(total), 0)
    INTO v_total_orders, v_total_revenue
    FROM public.orders
    WHERE restaurant_id = p_restaurant_id
      AND status NOT IN ('cancelled', 'rejected')
      AND created_at BETWEEN v_start AND v_end;

    -- 3. Top Products (Filtered)
    SELECT JSON_AGG(t) INTO v_top_products
    FROM (
        SELECT item_name as name, SUM(quantity) as sales
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        WHERE o.restaurant_id = p_restaurant_id
          AND o.status NOT IN ('cancelled', 'rejected')
          AND o.created_at BETWEEN v_start AND v_end
        GROUP BY item_name
        ORDER BY sales DESC
        LIMIT 5
    ) t;

    -- 4. Daily Data (Revenue & Orders)
    SELECT JSON_AGG(t) INTO v_daily_data
    FROM (
        WITH date_series AS (
            SELECT generate_series(v_chart_start, v_chart_end, INTERVAL '1 day')::DATE as d
        )
        SELECT 
            TO_CHAR(ds.d, 'MM-DD') as date,
            COALESCE(SUM(o.total), 0) as revenue,
            COUNT(o.id) as orders
        FROM date_series ds
        LEFT JOIN public.orders o ON DATE(o.created_at) = ds.d 
            AND o.restaurant_id = p_restaurant_id
            AND o.status NOT IN ('cancelled', 'rejected')
        GROUP BY ds.d
        ORDER BY ds.d ASC
    ) t;

    -- 5. Conversion Rates (Sales are filtered, Views are static for now)
    SELECT JSON_AGG(t) INTO v_conversion_rates
    FROM (
        SELECT 
            p.name,
            p.view_count as views,
            COALESCE(SUM(oi.quantity), 0) as sales,
            CASE 
                WHEN p.view_count > 0 THEN ROUND((COALESCE(SUM(oi.quantity), 0)::NUMERIC / p.view_count) * 100, 1)
                ELSE 0 
            END as rate
        FROM public.products p
        LEFT JOIN (
            SELECT product_id, quantity 
            FROM public.order_items oi
            JOIN public.orders o ON oi.order_id = o.id
            WHERE o.restaurant_id = p_restaurant_id
              AND o.status NOT IN ('cancelled', 'rejected')
              AND o.created_at BETWEEN v_start AND v_end
        ) oi ON p.id = oi.product_id
        WHERE p.restaurant_id = p_restaurant_id
          AND p.deleted_at IS NULL
          AND p.view_count > 0
        GROUP BY p.id, p.name, p.view_count
        ORDER BY p.view_count DESC
    ) t;

    -- Return combined JSON
    RETURN JSON_BUILD_OBJECT(
        'totalOrders', v_total_orders,
        'totalRevenue', v_total_revenue,
        'topProducts', COALESCE(v_top_products, '[]'::JSON),
        'dailyData', COALESCE(v_daily_data, '[]'::JSON),
        'conversionRates', COALESCE(v_conversion_rates, '[]'::JSON)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
