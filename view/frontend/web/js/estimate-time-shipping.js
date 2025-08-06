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

            const selectors = [
                'select[name="region_id"]',
                'select[name="country_id"]',
                'input[name="region"]',
                'input[name="postcode"]',
                '.radio',
                '.product-custom-option',
                '#qty'
            ];

            selectors.forEach(selector => {
                document.addEventListener('change', (e) => {
                    if (e.target.matches(selector)) {
                        this.fetchEstimatedDate();
                    }
                });
            });

            if (config.type === 'product') {
                const sections = [
                    'product_data_storage',
                    'customer',
                    'cart',
                    'directory-data',
                    'checkout-data',
                    'cart-data'
                ];

                document.addEventListener('customer-data-reload', (e, changedSections) => {
                    if (changedSections && changedSections.some(s => sections.includes(s))) {
                        this.fetchEstimatedDate();
                    }
                });
            }
        },

        getCartData() {
            return {
                'region_id': document.querySelector('select[name="region_id"]')?.value || '',
                'country_id': document.querySelector('select[name="country_id"]')?.value || '',
                'region': document.querySelector('input[name="region"]')?.value || '',
                'postcode': document.querySelector('input[name="postcode"]')?.value || ''
            };
        },

        async fetchEstimatedDate(itemId = null) {
            try {
                let baseUrl = window.BASE_URL || '';
                if (!baseUrl) {
                    const pathArray = window.location.pathname.split('/');
                    baseUrl = window.location.origin + (pathArray[1] ? '/' + pathArray[1] : '');
                }

                if (baseUrl && !baseUrl.endsWith('/')) {
                    baseUrl += '/';
                }

                const cartData = {
                    'region_id': document.querySelector('select[name="region_id"]')?.value || '',
                    'country_id': document.querySelector('select[name="country_id"]')?.value || '',
                    'region': document.querySelector('input[name="region"]')?.value || '',
                    'postcode': document.querySelector('input[name="postcode"]')?.value || ''
                };

                const params = new URLSearchParams();

                // Add parameters based on the type
                params.append('type', config.type || 'checkout');
                params.append('isAjax', 'true');

                if (config.type === 'product') {
                    params.append('currentSku', config.currentSku || '');
                    params.append('qty', document.querySelector('#qty')?.value || '1');
                }
                else if (config.type === 'checkout') {
                    params.set('type', 'cart');
                    params.append('address', JSON.stringify(cartData));

                    const shippingMethod = window.checkoutData?.getSelectedShippingRate() || '';
                    if (shippingMethod) {
                        params.append('method', shippingMethod);
                    }
                }
                else if (config.type === 'cart') {
                    params.append('address', JSON.stringify(cartData));

                    const shippingMethod = window.checkoutData?.getSelectedShippingRate() || '';
                    if (shippingMethod) {
                        params.append('method', shippingMethod);
                    }
                }

                if (itemId) {
                    params.append('itemId', itemId);
                }

                const url = `${baseUrl}estimatetimeshipping/estimation/quoteDate`;
                console.log('Fetching estimated date from:', url, 'with params:', params.toString());

                console.log('Request details:', {
                    url: url,
                    params: Object.fromEntries(params.entries()),
                    baseUrl: baseUrl,
                    config: config,
                    cartData: cartData
                });

                const response = await fetch(`${url}?${params}`, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                let data;

                if (!contentType || !contentType.includes('application/json')) {
                    try {
                        const text = await response.text();
                        console.warn('Response content-type is not application/json:', contentType);
                        console.log('Response text (first 200 chars):', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

                        const jsonMatch = text.match(/\{.*\}/s);
                        if (jsonMatch) {
                            console.log('Found JSON in response:', jsonMatch[0]);
                            data = JSON.parse(jsonMatch[0]);
                        } else {
                            throw new Error('Could not find JSON in response');
                        }
                    } catch (parseError) {
                        console.error('Failed to parse response as JSON:', parseError);
                        data = {
                            preparationDate: 'Estimated date not available',
                            dateExist: false,
                            display: true
                        };
                    }
                } else {
                    data = await response.json();
                }

                console.log('Processed data:', data);

                if (+data.display && !data.dateExist) {
                    this.estimatedDate = data.preparationDate;
                    this.isSuccess = false;
                    this.hasDate = true;
                } else if (data.dateExist) {
                    this.estimatedDate = data.preparationDate;
                    this.isSuccess = true;
                    this.hasDate = true;
                } else {
                    this.estimatedDate = '';
                    this.isSuccess = false;
                    this.hasDate = false;
                }
            } catch (error) {
                console.error('Error fetching estimated date:', error);
                this.estimatedDate = 'Estimated delivery date is currently unavailable. Please try again later.';
                this.isSuccess = false;
                this.hasDate = true;
            }
        },

        getValue() {
            this.fetchEstimatedDate();
        },

        getItemValue(itemId) {
            this.fetchEstimatedDate(itemId);
        }
    }));
});
