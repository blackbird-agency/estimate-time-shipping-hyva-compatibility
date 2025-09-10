<?php
namespace Blackbird\EstimateTimeShippingHyvaCompatibility\Plugin;

use Blackbird\EstimateTimeShipping\Helper\Data;
use Magento\Checkout\Block\Cart\Item\Renderer as SubjectRenderer;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\View\Element\Template;

class InjectPreparationTimeHtml
{
    /**
     * @param Data $helper
     */
    public function __construct(
        protected Data $helper
    ) {
    }

    /**
     * After toHtml for each item in the cart,
     * we inject the preparation time block.
     *
     * @param SubjectRenderer $subject
     * @param string $html
     * @return string
     * @throws LocalizedException
     */
    public function afterToHtml(SubjectRenderer $subject, string $html): string
    {
        if ($this->helper->getHowToDisplay()) {
            return $html;
        }

        /** @var Template $block */
        $block = $subject->getLayout()
            ->createBlock(Template::class)
            ->setData('item', $subject->getItem())
            ->setTemplate('Blackbird_EstimateTimeShippingHyvaCompatibility::cart_item_preparation_time.phtml');

        $injectedHtml = $block->toHtml();

        $pattern = '#(</dl>)#i';
        if (\preg_match($pattern, $html)) {
            $html = \preg_replace($pattern, '$1' . $injectedHtml, $html, 1);
        }

        return $html;
    }
}
