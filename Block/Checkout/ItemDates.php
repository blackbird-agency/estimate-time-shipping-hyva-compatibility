<?php
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

namespace Blackbird\HyvaEstimateTimeShipping\Block\Checkout;

use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Quote\Model\Quote\Item;

class ItemDates extends Template
{
    /**
     * @param Context $context
     * @param CheckoutSession $checkoutSession
     * @param array $data
     */
    public function __construct(
        Context $context,
        protected CheckoutSession $checkoutSession,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    /**
     * Get all visible items from the current quote
     *
     * @return Item[]
     */
    public function getQuoteItems()
    {
        try {
            $quote = $this->checkoutSession->getQuote();
            if ($quote && $quote->getId()) {
                return $quote->getAllVisibleItems();
            }
        } catch (\Exception $e) {
            $this->_logger->error('Error getting quote items: ' . $e->getMessage());
        }

        return [];
    }
}
