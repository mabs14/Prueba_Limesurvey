<?php

namespace LimeSurvey\Models\Services;

use LimeSurvey\Models\Services\SurveyAggregateService\{
    LanguageSettings,
    GeneralSettings,
    UrlParams,
    TemplateConfiguration
};
use LimeSurvey\Models\Services\Proxy\ProxyExpressionManager;
use LimeSurvey\Models\Services\Exception\{
    PersistErrorException,
    NotFoundException,
    PermissionDeniedException
};

/**
 * Survey Aggregate Service
 *
 * Service class for updating survey settings.
 *
 * Dependencies are injected to enable mocking.
 */
class SurveyAggregateService
{
    private LanguageSettings $languageSettings;
    private GeneralSettings $generalSettings;
    private UrlParams $urlParams;
    private ProxyExpressionManager $proxyExpressionManager;
    private TemplateConfiguration $templateConfiguration;
    private $restMode = false;

    public function __construct(
        LanguageSettings $languageSettings,
        GeneralSettings $generalSettings,
        UrlParams $urlParams,
        ProxyExpressionManager $proxyExpressionManager,
        TemplateConfiguration $templateConfiguration
    ) {
        $this->languageSettings = $languageSettings;
        $this->generalSettings = $generalSettings;
        $this->urlParams = $urlParams;
        $this->proxyExpressionManager = $proxyExpressionManager;
        $this->templateConfiguration = $templateConfiguration;
    }

    /**
     * Set REST Mode
     *
     * In rest mode we have different expecations about data formats.
     * For example datetime objects inputs/output
     * as UTC JSON format Y-m-d\TH:i:s.000\Z.
     *
     * @param bool $restMode
     */
    public function setRestMode($restMode)
    {
        $this->restMode = (bool) $restMode;
        $this->generalSettings->setRestMode($this->restMode);
    }

    /**
     * Update
     *
     * @param int $surveyId
     * @param array $input
     * @throws PersistErrorException
     * @throws NotFoundException
     * @throws PermissionDeniedException
     * @return array
     */
    public function update($surveyId, $input)
    {
        $this->languageSettings->update(
            $surveyId,
            $input
        );

        $meta = $this->generalSettings->update(
            $surveyId,
            $input
        );

        if (!empty($input['url_params'])) {
            $this->urlParams->update(
                $surveyId,
                $input['url_params']
            );
        }

        $this->proxyExpressionManager
            ->reset($surveyId);

        $this->templateConfiguration
            ->update($surveyId);

        return $meta;
    }
}
