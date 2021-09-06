// @flow
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import moment from 'moment';
import SVGInline from 'react-svg-inline';
import { defineMessages, intlShape } from 'react-intl';
import { PopOver } from 'react-polymorph/lib/components/PopOver';
import classnames from 'classnames';
import clockIcon from '../../../assets/images/clock-corner.inline.svg';
import noDataDashBigImage from '../../../assets/images/no-data-dash-big.inline.svg';
import styles from './ThumbPoolContent.scss';
import { getColorFromRange, getSaturationColor } from '../../../utils/colors';
import StakePool from '../../../domains/StakePool';
import {
  IS_RANKING_DATA_AVAILABLE,
  IS_SATURATION_DATA_AVAILABLE,
} from '../../../config/stakingConfig';
import { formattedWalletAmount } from '../../../utils/formatters';

type Props = {
  stakePool: StakePool,
  numberOfRankedStakePools: number,
};

const messages = defineMessages({
  pledgeNotMetPopOver: {
    id: 'staking.stakePools.tooltip.pledgeNotMet.popover',
    defaultMessage:
      '!!!This pool has not met its pledge requirements. This means that the pool will not produce blocks or generate rewards until the pledge is met.',
    description: '"pledgeNotMet" popover for the Stake Pools Tooltip page.',
  },
  retirement: {
    id: 'staking.stakePools.tooltip.retirement',
    defaultMessage: '!!!Retirement in {retirementFromNow}',
    description: '"Retirement" for the Stake Pools Tooltip page.',
  },
});

@observer
export default class ThumbPoolContent extends Component<Props> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  formattedRewards = (potentialRewards: BigNumber) => {
    const potentialRewardsAsString = formattedWalletAmount(potentialRewards);
    let targetLength = 4;
    if (potentialRewardsAsString.includes('.')) {
      targetLength++;
    }
    if (potentialRewardsAsString.includes(',')) {
      targetLength++;
    }
    if (potentialRewardsAsString.includes(' ')) {
      targetLength++;
    }
    return potentialRewardsAsString.substring(0, targetLength);
  };

  render() {
    const { intl } = this.context;
    const { stakePool, numberOfRankedStakePools } = this.props;
    const { ranking, ticker, retiring, pledgeNotMet, saturation } = stakePool;
    const color =
      !pledgeNotMet && getColorFromRange(ranking, numberOfRankedStakePools);

    const componentClassnames = classnames([
      styles.component,
      !IS_SATURATION_DATA_AVAILABLE ? styles.hideSaturation : null,
    ]);

    const saturationClassnames = classnames([
      styles.saturationBar,
      styles[getSaturationColor(saturation)],
    ]);

    const colorBandClassnames = classnames([
      styles.colorBand,
      pledgeNotMet ? styles.pledgeNotMet : null,
    ]);

    const retirementFromNow = retiring
      ? moment(retiring).locale(intl.locale).fromNow(true)
      : '';

    return (
      <div className={componentClassnames}>
        <div className={styles.ticker}>{ticker}</div>
        {IS_RANKING_DATA_AVAILABLE && !pledgeNotMet ? (
          <div className={styles.ranking} style={{ color }}>
            {ranking}
          </div>
        ) : (
          <div className={styles.noDataDash}>
            <PopOver
              content={intl.formatMessage(messages.pledgeNotMetPopOver)}
              zIndex={10000}
            >
              <SVGInline svg={noDataDashBigImage} />
            </PopOver>
          </div>
        )}
        {IS_SATURATION_DATA_AVAILABLE && !pledgeNotMet && (
          <div className={saturationClassnames}>
            <span
              style={{
                width: `${parseFloat(saturation).toFixed(2)}%`,
              }}
            />
          </div>
        )}
        {IS_RANKING_DATA_AVAILABLE ? (
          <>
            {retiring && (
              <div className={styles.retiringIcon}>
                <PopOver
                  content={intl.formatMessage(messages.retirement, {
                    retirementFromNow,
                  })}
                  zIndex={10000}
                >
                  <SVGInline svg={clockIcon} />
                </PopOver>
              </div>
            )}

            <div
              className={colorBandClassnames}
              style={{
                background: color,
              }}
            />
          </>
        ) : (
          <div className={styles.greyColorBand} />
        )}
      </div>
    );
  }
}
