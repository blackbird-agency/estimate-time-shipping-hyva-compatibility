/**
 * Blackbird EstimateTimeShipping Module - Hyva compatibility
 *
 * NOTICE OF LICENSE
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to support@bird.eu so we can send you a copy immediately.
 *
 * @category        Blackbird
 * @package         Blackbird_HyvaEstimateTimeShipping
 * @copyright       Copyright (c) 2018 Blackbird (https://black.bird.eu)
 * @author          Blackbird Team
 * @license         https://store.bird.eu/license/
 * @support         support@bird.eu
 */

document.addEventListener('alpine:init', () => {
    Alpine.data('estimateTimeShipping', (config) => ({
        estimatedDate: '',
        isSuccess: false,
        hasDate: false,

        init() {
            this.fetchEstimatedDate();

            const watchers = [
                'select[name="region_id"]',
                'select[name="country_id"]',
                'input[name="region"]',
                'input[name="postcode"]',
                '.radio',
                '.product-custom-option',
                '#qty'
            ];
            watchers.forEach(sel =>
                document.addEventListener('change', e =>
                    e.target.matches(sel) && this.fetchEstimatedDate()
                )
            );

            if (config.type === 'product') {
                const relevantSections = [
                    'product_data_storage',
                    'customer',
                    'cart',
                    'directory-data',
                    'checkout-data',
                    'cart-data'
                ];
                document.addEventListener('customer-data-reload', (e, changed) => {
                    if (changed?.some(s => relevantSections.includes(s))) {
                        this.fetchEstimatedDate();
                    }
                });
            }
        },

        getCartData() {
            const fields = ['region_id', 'country_id', 'region', 'postcode'];
            return fields.reduce((acc, name) => {
                const el = document.querySelector(
                    name.includes('_') ? `select[name="${name}"]` : `input[name="${name}"]`
                );
                acc[name] = el?.value || '';
                return acc;
            }, {});
        },

        buildBaseUrl() {
            let base = window.BASE_URL || '';
            if (!base) {
                const parts = window.location.pathname.split('/');
                base = window.location.origin + (parts[1] ? '/' + parts[1] : '');
            }
            return base.endsWith('/') ? base : base + '/';
        },

        buildParams(itemId) {
            const params = new URLSearchParams({
                type: config.type || 'checkout',
                isAjax: 'true'
            });

            if (config.type === 'product') {
                params.append('currentSku', config.currentSku || '');
                params.append('qty', document.querySelector('#qty')?.value || '1');
            } else {
                if (config.type === 'checkout') {
                    params.set('type', 'cart');
                }
                params.append('address', JSON.stringify(this.getCartData()));
                const method = window.checkoutData?.getSelectedShippingRate();
                if (method) params.append('method', method);
            }

            if (itemId) {
                params.append('itemId', itemId);
            }

            return params;
        },

        async fetchEstimatedDate(itemId = null) {
            try {
                const baseUrl = this.buildBaseUrl();
                const url = `${baseUrl}estimatetimeshipping/estimation/quoteDate`;
                const params = this.buildParams(itemId);

                console.log('Fetching estimation:', url, params.toString());

                const response = await fetch(`${url}?${params}`, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Status ${response.status}`);
                }

                let data;
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    const match = text.match(/\{[\s\S]*\}/);
                    data = match ? JSON.parse(match[0]) : {};
                }

                if (+data.display && !data.dateExist) {
                    this.estimatedDate = data.preparationDate;
                    this.isSuccess     = false;
                    this.hasDate       = true;
                } else if (data.dateExist) {
                    this.estimatedDate = data.preparationDate;
                    this.isSuccess     = true;
                    this.hasDate       = true;
                } else {
                    this.estimatedDate = '';
                    this.isSuccess     = false;
                    this.hasDate       = false;
                }
            } catch (err) {
                console.error('Error fetching estimated date:', err);
                this.estimatedDate = 'Estimated delivery date is currently unavailable. Please try again later.';
                this.isSuccess     = false;
                this.hasDate       = true;
            }
        },

        getValue()     { this.fetchEstimatedDate(); },
        getItemValue(id) { this.fetchEstimatedDate(id); }
    }));
});
