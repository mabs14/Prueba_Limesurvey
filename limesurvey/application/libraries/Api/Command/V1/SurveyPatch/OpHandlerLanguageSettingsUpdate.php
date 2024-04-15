<?php

namespace LimeSurvey\Api\Command\V1\SurveyPatch;

use DI\DependencyException;
use DI\NotFoundException;
use LimeSurvey\Api\Command\V1\SurveyPatch\Traits\OpHandlerExceptionTrait;
use LimeSurvey\Api\Command\V1\SurveyPatch\Traits\OpHandlerValidationTrait;
use SurveyLanguageSetting;
use LimeSurvey\Api\Command\V1\Transformer\{
    Input\TransformerInputSurveyLanguageSettings,
};
use LimeSurvey\Api\Command\V1\SurveyPatch\Traits\OpHandlerSurveyTrait;
use LimeSurvey\Api\Transformer\TransformerInterface;
use LimeSurvey\Models\Services\{
    Exception\PermissionDeniedException,
    Exception\PersistErrorException,
    SurveyAggregateService\LanguageSettings
};
use LimeSurvey\ObjectPatch\{
    Op\OpInterface,
    OpHandler\OpHandlerException,
    OpHandler\OpHandlerInterface,
    OpType\OpTypeUpdate
};

class OpHandlerLanguageSettingsUpdate implements OpHandlerInterface
{
    use OpHandlerSurveyTrait;
    use OpHandlerExceptionTrait;
    use OpHandlerValidationTrait;

    protected string $entity;
    protected SurveyLanguageSetting $model;
    protected TransformerInterface $transformer;

    public function __construct(
        SurveyLanguageSetting $model,
        TransformerInputSurveyLanguageSettings $transformer
    ) {
        $this->entity = 'languageSetting';
        $this->model = $model;
        $this->transformer = $transformer;
    }

    public function canHandle(OpInterface $op): bool
    {
        $isUpdateOperation = $op->getType()->getId() === OpTypeUpdate::ID;
        $isLanguageSettingEntity = $op->getEntityType() === 'languageSetting';
        return $isUpdateOperation && $isLanguageSettingEntity;
    }

    /**
     * This handler accepts two different approaches to update the language settings:
     * Approach 1 (single language):
     * - in this case the language needs to be part of the id array
     * - patch structure:
     *      {
     *          "entity": "languageSetting",
     *          "op": "update",
     *          "id": "de",
     *          "props": {
     *              "title": "Beispielfragebogen"
     *          }
     *      }
     *
     * Approach 2 (multiple languages):
     * - in this case the languages need to be indexes of the props array
     * - language must not be part of the id array
     * - patch structure:
     *      {
     *          "entity": "languageSetting",
     *          "op": "update",
     *          "id": null,
     *          "props": {
     *              "de": {
     *                  "title": "Beispielfragebogen"
     *              },
     *              "en": {
     *                  "title": "Example Survey"
     *              }
     *          }
     *      }
     * @param OpInterface $op
     * @return void
     * @throws OpHandlerException
     * @throws DependencyException
     * @throws NotFoundException
     * @throws \LimeSurvey\Models\Services\Exception\NotFoundException
     * @throws PermissionDeniedException
     * @throws PersistErrorException
     */
    public function handle(OpInterface $op): void
    {
        $diContainer = \LimeSurvey\DI::getContainer();
        $languageSettings = $diContainer->get(
            LanguageSettings::class
        );
        $data = $this->transformer->transformAll(
            $op->getProps(),
            [
                'operation' => $op->getType()->getId(),
                'entityId'  => $op->getEntityId(),
                'sid'       => $this->getSurveyIdFromContext($op)
            ]
        );
        if (empty($data)) {
            $this->throwNoValuesException($op);
        }
        $languageSettings->update(
            $this->getSurveyIdFromContext($op),
            $data
        );
    }

    /**
     * Checks if patch is valid for this operation.
     * @param OpInterface $op
     * @return array
     */
    public function validateOperation(OpInterface $op): array
    {
        $validationData = [];
        $checkDataEntityId = $this->validateEntityId($op, []);
        $checkDataCollection = $this->validateCollection($op, []);
        if (empty($checkDataEntityId) && empty($checkDataCollection)) {
            // operation data has an entity id and props came as collection
            $validationData = $this->addErrorToValidationData(
                'props can not come as collection if id is set',
                $validationData
            );
        } elseif (!empty($checkDataEntityId) && !empty($checkDataCollection)) {
            // operation data has no entity id and props came not as collection
            $validationData = $checkDataCollection;
        } elseif (!empty($checkDataEntityId)) {
            // operation data has no entity id so collection indexes are validated
            $validationData = $this->validateCollectionIndex($op, $validationData);
        }

        if (empty($validationData)) {
            $validationData = $this->transformer->validateAll(
                $op->getProps(),
                [
                    'operation' => $op->getType()->getId(),
                    'entityId'  => $op->getEntityId(),
                    'sid'       => $this->getSurveyIdFromContext($op)
                ]
            );
        }

        return $this->getValidationReturn(
            gT('Could not save language settings'),
            !is_array($validationData) ? [] : $validationData,
            $op
        );
    }
}
