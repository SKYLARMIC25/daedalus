// @flow
import React, { Component } from 'react';
import {
  defineMessages,
  intlShape,
  FormattedMessage,
  FormattedHTMLMessage,
} from 'react-intl';
import classNames from 'classnames';
import { Stepper } from 'react-polymorph/lib/components/Stepper';
import { StepperSkin } from 'react-polymorph/lib/skins/simple/StepperSkin';
import { find, get } from 'lodash';
import DialogCloseButton from '../../widgets/DialogCloseButton';
import DialogBackButton from '../../widgets/DialogBackButton';
import Dialog from '../../widgets/Dialog';
import { StakePoolsList } from '../stake-pools/StakePoolsList';
import { StakePoolsSearch } from '../stake-pools/StakePoolsSearch';
import { getFilteredStakePoolsList } from '../stake-pools/helpers';
import BackToTopButton from '../../widgets/BackToTopButton';
import commonStyles from './DelegationSteps.scss';
import styles from './DelegationStepsChooseStakePoolDialog.scss';
import Wallet from '../../../domains/Wallet';
import ThumbSelectedPool from '../widgets/ThumbSelectedPool';
import { IS_RANKING_DATA_AVAILABLE } from '../../../config/stakingConfig';
import type { StakePoolFilterOptionsType } from '../../../stores/StakingStore';
import {
  getNumberOfFilterDimensionsApplied,
  hasStakePoolHighProfitMargin,
} from '../../../utils/staking';
import StakePool from '../../../domains/StakePool';

const messages = defineMessages({
  title: {
    id: 'staking.delegationSetup.chooseStakePool.step.dialog.title',
    defaultMessage: '!!!Choose a stake pool',
    description:
      'Title "Choose a stake pool" on the delegation setup "choose stake pool" dialog.',
  },
  description: {
    id: 'staking.delegationSetup.chooseStakePool.step.dialog.description',
    defaultMessage: '!!!Currently selected stake pool:',
    description:
      'Description on the delegation setup "choose stake pool" dialog.',
  },
  selectStakePoolLabel: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.selectStakePoolLabel',
    defaultMessage:
      '!!!Select a stake pool to receive your delegated funds in the <span>{selectedWalletName}<span> wallet.',
    description:
      'Select / Selected pool section label on the delegation setup "choose stake pool" dialog.',
  },
  selectedStakePoolLabel: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.selectedStakePoolLabel',
    defaultMessage:
      '!!!You have selected [{selectedPoolTicker}] stake pool to delegate to for <span>{selectedWalletName}</span> wallet.',
    description:
      '"Selected Pools" Selected pool label on the delegation setup "choose stake pool" dialog.',
  },
  selectedStakePoolLabelRetiring: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.selectedStakePoolLabelRetiring',
    defaultMessage:
      '!!!The [{selectedPoolTicker}] stake pool which you have selected to delegate your <span>{selectedWalletName}</span> wallet funds is about to retire.',
    description:
      '"Selected Pools" Selected pool label on the delegation setup "choose stake pool" dialog.',
  },
  delegatedStakePoolLabel: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.delegatedStakePoolLabel',
    defaultMessage:
      '!!!You are already delegating <span>{selectedWalletName}</span> wallet to <span>[{selectedPoolTicker}]</span> stake pool. <span>If you wish to re-delegate your stake, please select a different pool.</span>',
    description:
      '"You are already delegating to stake pool" label on the delegation setup "choose stake pool" dialog.',
  },
  delegatedStakePoolNextLabel: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.delegatedStakePoolNextLabel',
    defaultMessage:
      '!!!You are already pending delegation <span>{selectedWalletName}</span> wallet to <span>[{selectedPoolTicker}]</span> stake pool. <span>If you wish to re-delegate your stake, please select a different pool.</span>',
    description:
      '"You are already delegating to stake pool" label on the delegation setup "choose stake pool" dialog.',
  },
  recentPoolsLabel: {
    id: 'staking.delegationSetup.chooseStakePool.step.dialog.recentPoolsLabel',
    defaultMessage: '!!!Choose one of your recent stake pool choices:',
    description:
      'Recent "Pool" choice section label on the delegation setup "choose stake pool" dialog.',
  },
  searchInputLabel: {
    id: 'staking.delegationSetup.chooseStakePool.step.dialog.searchInput.label',
    defaultMessage:
      '!!!Or select a stake pool from the list of all available stake pools:',
    description:
      'Search "Pools" input label on the delegation setup "choose stake pool" dialog.',
  },
  searchInputPlaceholder: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.searchInput.placeholder',
    defaultMessage: '!!!Search stake pools',
    description:
      'Search "Pools" input placeholder on the delegation setup "choose stake pool" dialog.',
  },
  continueButtonLabel: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.continueButtonLabel',
    defaultMessage: '!!!Continue',
    description:
      'Label for continue button on the delegation setup "choose stake pool" dialog.',
  },
  stepIndicatorLabel: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.stepIndicatorLabel',
    defaultMessage: '!!!STEP {currentStep} OF {totalSteps}',
    description:
      'Step indicator label on the delegation setup "choose wallet" step dialog.',
  },
  retiringPoolFooter: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.retiringPoolFooter',
    defaultMessage:
      '!!!The stake pool you have selected is about to be retired. If you delegate to this pool, you will need to redelegate your wallet to a different pool at least one entire epoch before the current pool’s retirement date to avoid losing rewards.',
    description:
      'Retiring Pool Footer label on the delegation setup "choose wallet" step dialog.',
  },
  privatePoolFooter: {
    id: 'staking.delegationSetup.chooseStakePool.step.dialog.privatePoolFooter',
    defaultMessage:
      '!!!The stake pool you have selected is private as its margin is 100%. If you delegate to this pool, all rewards will go to the stake pool, and you will not earn delegation rewards.',
    description:
      'Private Pool Footer label on the delegation setup "choose wallet" step dialog.',
  },
  highProfitMarginPoolFooter: {
    id:
      'staking.delegationSetup.chooseStakePool.step.dialog.highProfitMarginPoolFooter',
    defaultMessage:
      '!!!The stake pool you have selected has a high margin of {profitMarginPercentage}%. You could earn more  rewards by delegating to a different pool. Delegating to pools with high margins is not a concern if they are charity pools or if you are supporting a pool for different reasons.',
    description:
      'High Profit Margin Pool Footer label on the delegation setup "choose wallet" step dialog.',
  },
});

type Props = {
  stepsList: Array<string>,
  recentStakePools: Array<StakePool>,
  stakePoolsList: Array<StakePool>,
  selectedWallet: ?Wallet,
  onOpenExternalLink: Function,
  currentTheme: string,
  selectedPool: ?StakePool,
  onClose: Function,
  onBack: Function,
  onSelectPool: Function,
  filterOptions: StakePoolFilterOptionsType,
  onFilter: Function,
  populatedFilterOptions: StakePoolFilterOptionsType,
};

type State = {
  searchValue: string,
  selectedList?: ?string,
  selectedPoolId: ?number,
};

export default class DelegationStepsChooseStakePoolDialog extends Component<
  Props,
  State
> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  state = {
    searchValue: '',
    selectedList: null,
    selectedPoolId: get(this.props, ['selectedPool', 'id'], null),
  };

  handleSearch = (searchValue: string) => this.setState({ searchValue });
  handleClearSearch = () => this.setState({ searchValue: '' });

  handleSelect = (selectedPoolId: number) => {
    this.setState({ selectedPoolId });
  };

  handleSetListActive = (selectedList: string) => {
    this.setState({ selectedList });
  };

  onAcceptPool = () => {
    const { selectedPoolId } = this.state;
    this.props.onSelectPool(selectedPoolId);
  };

  render() {
    const { intl } = this.context;
    const {
      stepsList,
      recentStakePools,
      stakePoolsList,
      onOpenExternalLink,
      currentTheme,
      selectedWallet,
      onClose,
      onBack,
      filterOptions,
      onFilter,
      populatedFilterOptions,
    } = this.props;
    const { searchValue, selectedList, selectedPoolId } = this.state;
    const selectedWalletName = get(selectedWallet, 'name');
    const selectedPool = find(
      stakePoolsList,
      (stakePool) => stakePool.id === selectedPoolId
    );
    const lastDelegatedStakePoolId = get(
      selectedWallet,
      'lastDelegatedStakePoolId',
      null
    );
    const delegatedStakePoolId = get(
      selectedWallet,
      'delegatedStakePoolId',
      null
    );
    const pendingDelegations = get(selectedWallet, 'pendingDelegations', null);

    const hasPendingDelegations =
      pendingDelegations && pendingDelegations.length > 0;
    let activeStakePoolId = delegatedStakePoolId;
    if (hasPendingDelegations) {
      activeStakePoolId = lastDelegatedStakePoolId;
    }

    const selectedPoolTicker = get(selectedPool, 'ticker');
    const canSubmit =
      !activeStakePoolId || activeStakePoolId !== selectedPoolId;

    const actions = [
      {
        className: 'continueButton',
        label: intl.formatMessage(messages.continueButtonLabel),
        onClick: this.onAcceptPool,
        primary: true,
        disabled: !selectedPoolId || !canSubmit,
      },
    ];

    const retiringFooter =
      selectedPool && selectedPool.isRetiring ? (
        <div className={styles.poolFooterContent}>
          {intl.formatMessage(messages.retiringPoolFooter)}
        </div>
      ) : null;
    const privateFooter =
      selectedPool && selectedPool.isPrivate ? (
        <div className={styles.poolFooterContent}>
          {intl.formatMessage(messages.privatePoolFooter)}
        </div>
      ) : null;
    const highProfitMarginFooter =
      selectedPool &&
      !selectedPool.isPrivate &&
      hasStakePoolHighProfitMargin(selectedPool) ? (
        <div className={styles.poolFooterContent}>
          <FormattedHTMLMessage
            {...messages.highProfitMarginPoolFooter}
            values={{
              profitMarginPercentage: selectedPool.profitMargin,
            }}
          />
        </div>
      ) : null;
    const footer = (
      <div className={styles.poolFooter}>
        {retiringFooter}
        {privateFooter}
        {highProfitMarginFooter}
      </div>
    );

    const dialogClassName = classNames([
      commonStyles.delegationSteps,
      styles.delegationStepsChooseStakePoolDialogWrapper,
    ]);
    const contentClassName = classNames([commonStyles.content, styles.content]);

    const selectionPoolLabel = () => {
      let label = '';
      // Label when selected wallet already delegating to selected stake pool
      if (
        selectedPoolId &&
        activeStakePoolId === delegatedStakePoolId &&
        delegatedStakePoolId === selectedPoolId
      ) {
        label = (
          <FormattedHTMLMessage
            {...messages.delegatedStakePoolLabel}
            values={{
              selectedWalletName,
              selectedPoolTicker,
            }}
          />
        );
      } else if (
        selectedPoolId &&
        activeStakePoolId === lastDelegatedStakePoolId &&
        lastDelegatedStakePoolId === selectedPoolId
      ) {
        label = (
          <FormattedHTMLMessage
            {...messages.delegatedStakePoolNextLabel}
            values={{
              selectedWalletName,
              selectedPoolTicker,
            }}
          />
        );
      } else if (selectedPoolId) {
        // Stake pool selected and selected wallet are not delegated to it
        const message = !selectedPool.retiring
          ? messages.selectedStakePoolLabel
          : messages.selectedStakePoolLabelRetiring;
        label = (
          <FormattedHTMLMessage
            {...message}
            values={{
              selectedWalletName,
              selectedPoolTicker,
            }}
          />
        );
      } else {
        // Stake pool not selected.
        label = (
          <FormattedHTMLMessage
            {...messages.selectStakePoolLabel}
            values={{
              selectedWalletName,
            }}
          />
        );
      }
      return label;
    };

    const stepsIndicatorLabel = (
      <FormattedMessage
        {...messages.stepIndicatorLabel}
        values={{
          currentStep: 2,
          totalSteps: stepsList.length,
        }}
      />
    );

    const numberOfFilterDimensionsApplied = getNumberOfFilterDimensionsApplied(
      filterOptions
    );

    const filteredStakePoolsList: Array<StakePool> = getFilteredStakePoolsList(
      stakePoolsList,
      searchValue
    );

    const isFilterDisabled =
      !filteredStakePoolsList.length && !numberOfFilterDimensionsApplied;

    const numberOfRankedStakePools: number = stakePoolsList.filter(
      (stakePool) =>
        IS_RANKING_DATA_AVAILABLE && stakePool.nonMyopicMemberRewards
    ).length;

    return (
      <Dialog
        title={intl.formatMessage(messages.title)}
        subtitle={stepsIndicatorLabel}
        actions={actions}
        footer={footer}
        closeOnOverlayClick
        onClose={onClose}
        className={dialogClassName}
        closeButton={<DialogCloseButton onClose={onClose} />}
        backButton={<DialogBackButton onBack={onBack} />}
      >
        <BackToTopButton
          scrollableElementClassName="Dialog_contentWrapper"
          buttonTopPosition={100}
          scrollTopToActivate={100}
        />

        <div className={commonStyles.delegationStepsIndicatorWrapper}>
          <Stepper
            steps={stepsList}
            activeStep={2}
            skin={StepperSkin}
            labelDisabled
          />
        </div>

        <div className={contentClassName}>
          <p className={styles.description}>
            {intl.formatMessage(messages.description)}
          </p>

          <div className={styles.selectStakePoolWrapper}>
            <ThumbSelectedPool
              stakePool={selectedPool}
              numberOfRankedStakePools={numberOfRankedStakePools}
              alreadyDelegated={selectedPool && !canSubmit}
            />

            <p className={styles.selectStakePoolLabel}>
              {selectionPoolLabel()}
            </p>
          </div>

          <div className={styles.recentStakePoolsWrapper}>
            {recentStakePools.length > 0 && (
              <p className={styles.recentStakePoolsLabel}>
                <FormattedMessage {...messages.recentPoolsLabel} values={{}} />
              </p>
            )}
            <StakePoolsList
              listName="recentStakePools"
              stakePoolsList={recentStakePools}
              onOpenExternalLink={onOpenExternalLink}
              currentTheme={currentTheme}
              isListActive={selectedList === 'recentStakePools'}
              setListActive={this.handleSetListActive}
              containerClassName="Dialog_content"
              onSelect={this.handleSelect}
              selectedPoolId={selectedPoolId}
              numberOfRankedStakePools={numberOfRankedStakePools}
              disabledStakePoolId={activeStakePoolId}
              showSelected
              highlightOnHover
            />
          </div>

          <div className={styles.searchStakePoolsWrapper}>
            <StakePoolsSearch
              search={searchValue}
              label={intl.formatMessage(messages.searchInputLabel)}
              placeholder={intl.formatMessage(messages.searchInputPlaceholder)}
              onSearch={this.handleSearch}
              onClearSearch={this.handleClearSearch}
              scrollableElementClassName="Dialog_content"
              disabledStakePoolId={activeStakePoolId}
              filterPopOverProps={{
                populatedFilterOptions,
                onFilter,
                isFilterDisabled,
                numberOfFilterDimensionsApplied,
              }}
            />
          </div>

          <div className={styles.stakePoolsListWrapper}>
            <StakePoolsList
              listName="selectedIndexList"
              stakePoolsList={filteredStakePoolsList}
              onOpenExternalLink={onOpenExternalLink}
              currentTheme={currentTheme}
              isListActive={selectedList === 'selectedIndexList'}
              setListActive={this.handleSetListActive}
              onSelect={this.handleSelect}
              selectedPoolId={selectedPoolId}
              containerClassName="Dialog_content"
              numberOfRankedStakePools={numberOfRankedStakePools}
              disabledStakePoolId={activeStakePoolId}
              showSelected
              highlightOnHover
            />
          </div>
        </div>
      </Dialog>
    );
  }
}
