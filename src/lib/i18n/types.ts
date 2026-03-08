export type Locale = "ar" | "ku" | "en";

export type TranslationKeys = {
    common: {
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        add: string;
        close: string;
        search: string;
        loading: string;
        noData: string;
        confirm: string;
        back: string;
        next: string;
        submit: string;
        copy: string;
        copied: string;
        download: string;
        share: string;
        yes: string;
        no: string;
        all: string;
        actions: string;
        status: string;
        name: string;
        price: string;
        description: string;
        image: string;
        active: string;
        inactive: string;
        required: string;
        optional: string;
    };
    sidebar: {
        dashboard: string;
        orders: string;
        activeOrders: string;
        orderHistory: string;
        menu: string;
        analytics: string;
        appearance: string;
        delivery: string;
        discounts: string;
        billing: string;
        settings: string;
        logout: string;
    };
    dashboard: {
        welcomeBack: string;
        subtitle: string;
        totalProducts: string;
        totalCategories: string;
        totalOrders: string;
        monthlyRevenue: string;
        shareMenu: string;
        orderMethods: string;
        dineIn: string;
        dineInDesc: string;
        takeaway: string;
        takeawayDesc: string;
        deliveryLabel: string;
        deliveryDesc: string;
    };
    analytics: {
        title: string;
        subtitle: string;
        totalRevenue: string;
        totalOrders: string;
        topProduct: string;
        allTime: string;
        fulfilled: string;
        unitsSold: string;
        waitingOrders: string;
        revenueLast7: string;
        topSelling: string;
        noSalesData: string;
        intentAnalytics: string;
        productName: string;
        totalViews: string;
        totalSold: string;
        conversionRate: string;
        noViewData: string;
        totalVisits: string;
        viaQr: string;
        viaDirect: string;
        ofTotal: string;
        visitsLast7: string;
        qrCode: string;
        directLink: string;
    };
    notifications: {
        title: string;
        newCount: string;
        noNew: string;
        upgradePlan: string;
    };
    onboarding: {
        title: string;
        stepsCompleted: string;
        addCategory: string;
        addProduct: string;
        customizeAppearance: string;
        shareQr: string;
    };
    qr: {
        storeQr: string;
        scanToVisit: string;
        downloadQr: string;
        copyLink: string;
        openStore: string;
        linkCopied: string;
        copyFailed: string;
        qrDownloaded: string;
        shareMenu: string;
    };
    menu: {
        menuManagement: string;
        categories: string;
        products: string;
        addCategory: string;
        addProduct: string;
        editCategory: string;
        editProduct: string;
        categoryName: string;
        productName: string;
        noCategories: string;
        noProducts: string;
        available: string;
        unavailable: string;
        hidden: string;
    };
    orders: {
        activeOrders: string;
        orderHistory: string;
        orderId: string;
        customer: string;
        items: string;
        total: string;
        pending: string;
        confirmed: string;
        preparing: string;
        delivered: string;
        completed: string;
        cancelled: string;
        rejected: string;
        noOrders: string;
        acceptOrder: string;
        rejectOrder: string;
    };
    settings: {
        title: string;
        restaurantName: string;
        slug: string;
        ownerName: string;
        email: string;
        phone: string;
        saveChanges: string;
        workingHours: string;
        day: string;
        openTime: string;
        closeTime: string;
        closed: string;
    };
    appearance: {
        title: string;
        primaryColor: string;
        logo: string;
        banner: string;
        uploadLogo: string;
        uploadBanner: string;
        preview: string;
    };
    deliverySettings: {
        title: string;
        zones: string;
        addZone: string;
        zoneName: string;
        flatRate: string;
        freeThreshold: string;
        areas: string;
        addArea: string;
    };
    billing: {
        title: string;
        currentPlan: string;
        free: string;
        pro: string;
        business: string;
        upgrade: string;
        productsUsed: string;
        ordersUsed: string;
    };
    discounts: {
        title: string;
        addCoupon: string;
        code: string;
        discountType: string;
        percentage: string;
        fixed: string;
        freeDelivery: string;
        value: string;
        minOrder: string;
        maxUses: string;
        expiresAt: string;
        noCoupons: string;
    };
};

export type Direction = "rtl" | "ltr";

export const localeConfig: Record<Locale, { label: string; flag: string; dir: Direction; nativeName: string }> = {
    ar: { label: "العربية", flag: "🇮🇶", dir: "rtl", nativeName: "العربية" },
    ku: { label: "کوردی", flag: "🇮🇶", dir: "rtl", nativeName: "کوردی" },
    en: { label: "English", flag: "🇺🇸", dir: "ltr", nativeName: "English" },
};
