/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AppBanner from 'amo/components/AppBanner';
import Link from 'amo/components/Link';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import {
  checkInternalURL,
  getAddonURL,
  getPromotedBadgesLinkUrl,
} from 'amo/utils';
import {
  DEFAULT_UTM_SOURCE,
  DEFAULT_UTM_MEDIUM,
  LINE,
  RECOMMENDED,
} from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import { sanitizeUserHTML } from 'core/utils';
import { getPromotedCategory } from 'core/utils/addons';
import { addQueryParams } from 'core/utils/url';
import LoadingText from 'ui/components/LoadingText';
import type { PrimaryHeroShelfType } from 'amo/reducers/home';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/types/errorHandler';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const PRIMARY_HERO_CLICK_ACTION = 'primary-hero-click';
export const PRIMARY_HERO_CLICK_CATEGORY = 'AMO Primary Hero Clicks';
export const PRIMARY_HERO_EXTERNAL_LABEL = 'external-link';
export const PRIMARY_HERO_IMPRESSION_ACTION = 'primary-hero-impression';
export const PRIMARY_HERO_IMPRESSION_CATEGORY = 'AMO Primary Hero Impressions';
export const PRIMARY_HERO_SRC = 'homepage-primary-hero';

type Props = {|
  errorHandler: ErrorHandlerType,
  shelfData?: PrimaryHeroShelfType,
|};

export type InternalProps = {|
  ...Props,
  _checkInternalURL: typeof checkInternalURL,
  _getPromotedCategory: typeof getPromotedCategory,
  _tracking: typeof tracking,
  clientApp: string,
  i18n: I18nType,
  siteIsReadOnly: boolean,
  siteNotice: string | null,
|};

export class HeroRecommendationBase extends React.Component<InternalProps> {
  static defaultProps = {
    _checkInternalURL: checkInternalURL,
    _getPromotedCategory: getPromotedCategory,
    _tracking: tracking,
  };

  makeCallToActionURL = () => {
    const { shelfData } = this.props;
    invariant(shelfData, 'The shelfData property is required');

    const { addon, external } = shelfData;

    if (addon) {
      return addQueryParams(getAddonURL(addon.slug), {
        utm_source: DEFAULT_UTM_SOURCE,
        utm_medium: DEFAULT_UTM_MEDIUM,
        utm_content: PRIMARY_HERO_SRC,
      });
    }

    invariant(external, 'Either an addon or an external is required');
    return addQueryParams(external.homepage, {
      utm_source: DEFAULT_UTM_SOURCE,
      utm_medium: DEFAULT_UTM_MEDIUM,
      utm_content: PRIMARY_HERO_SRC,
    });
  };

  onHeroClick = () => {
    const { _tracking, shelfData } = this.props;

    invariant(shelfData, 'The shelfData property is required');

    const { addon } = shelfData;

    _tracking.sendEvent({
      action: PRIMARY_HERO_CLICK_ACTION,
      category: PRIMARY_HERO_CLICK_CATEGORY,
      label: addon ? addon.guid : PRIMARY_HERO_EXTERNAL_LABEL,
    });
  };

  onHeroImpression = () => {
    const { _tracking, shelfData } = this.props;

    invariant(shelfData, 'The shelfData property is required');

    const { addon } = shelfData;

    _tracking.sendEvent({
      action: PRIMARY_HERO_IMPRESSION_ACTION,
      category: PRIMARY_HERO_IMPRESSION_CATEGORY,
      label: addon ? addon.guid : PRIMARY_HERO_EXTERNAL_LABEL,
    });
  };

  componentDidMount() {
    const { shelfData } = this.props;

    if (shelfData) {
      this.onHeroImpression();
    }
  }

  componentDidUpdate(prevProps: InternalProps) {
    const { shelfData } = this.props;

    if (shelfData && prevProps.shelfData !== shelfData) {
      this.onHeroImpression();
    }
  }

  render() {
    const {
      _checkInternalURL,
      _getPromotedCategory,
      clientApp,
      i18n,
      errorHandler,
      shelfData,
      siteIsReadOnly,
      siteNotice,
    } = this.props;
    const { addon, description, external, featuredImage, gradient } =
      shelfData || {};

    let gradientsClassName;
    let heading;
    let link;
    let loading = false;

    const heightClassName =
      siteIsReadOnly || siteNotice
        ? 'HeroRecommendation--height-with-notice'
        : 'HeroRecommendation--height-without-notice';

    if (shelfData) {
      gradientsClassName = `HeroRecommendation-${gradient.start}-${gradient.end}`;
      log.debug(
        `className ${gradientsClassName} generated from the API response. This should match a selector in styles.scss`,
      );

      const linkInsides = <span> {i18n.gettext('Get the extension')} </span>;
      const linkProps = _checkInternalURL({
        urlString: this.makeCallToActionURL(),
      }).isInternal
        ? {}
        : { rel: 'noopener noreferrer', target: '_blank' };

      if (addon) {
        heading = addon.name;
        link = (
          <Link
            className="HeroRecommendation-link"
            onClick={this.onHeroClick}
            to={this.makeCallToActionURL()}
          >
            {linkInsides}
          </Link>
        );
      } else if (external) {
        heading = external.name;
        link = (
          <a
            className="HeroRecommendation-link"
            href={this.makeCallToActionURL()}
            onClick={this.onHeroClick}
            {...linkProps}
          >
            {linkInsides}
          </a>
        );
      }
    } else {
      gradientsClassName = `HeroRecommendation--loading`;
      loading = true;
    }

    const renderHeroTitle = () => {
      // translators: If uppercase does not work in your locale,
      // change it to lowercase. This is used as a secondary heading.
      let titleText = i18n.gettext('SPONSORED');

      const promotedCategory = _getPromotedCategory({
        addon,
        clientApp,
        forBadging: true,
      });

      if (promotedCategory === RECOMMENDED) {
        // translators: If uppercase does not work in your locale,
        // change it to lowercase. This is used as a secondary heading.
        titleText = i18n.gettext('RECOMMENDED');
      } else if (promotedCategory === LINE) {
        // translators: If uppercase does not work in your locale,
        // change it to lowercase. This is used as a secondary heading.
        titleText = i18n.gettext('BY FIREFOX');
      }

      return (
        <div className="HeroRecommendation-title">
          <div className="HeroRecommendation-title-text">
            {loading ? <LoadingText width={20} /> : titleText}
          </div>
          {![LINE, RECOMMENDED].includes(promotedCategory) && !loading ? (
            <a
              className="HeroRecommendation-title-link"
              href={`${getPromotedBadgesLinkUrl({
                utm_content: PRIMARY_HERO_SRC,
              })}#sponsored`}
              rel="noopener noreferrer"
              target="_blank"
              title={i18n.gettext(
                'Firefox only recommends extensions that meet our standards for security and performance.',
              )}
            >
              What is this?
            </a>
          ) : null}
        </div>
      );
    };

    return (
      <section
        className={makeClassName(
          'HeroRecommendation',
          gradientsClassName,
          heightClassName,
          {
            'HeroRecommendation--no-image': !featuredImage,
          },
        )}
      >
        <div className="HeroRecommendation-wrapper">
          {/* The AppBanner is included here as it wants to live inside the
          HeroRecommendation on the home page. All other pages in the app
          include it via the Page component. */}
          <AppBanner className="HeroRecommendation-banner" />
          {/* The WrongPlatformWarning is included here as it wants to live
          inside the HeroRecommendation on the home page. Most other pages in
          the app include it via the Page component. */}
          <WrongPlatformWarning className="HeroRecommendation-WrongPlatformWarning" />

          {errorHandler.renderErrorIfPresent()}

          <div className="HeroRecommendation-content">
            {featuredImage && (
              <div className="HeroRecommendation-image-wrapper">
                <img
                  className="HeroRecommendation-image"
                  alt=""
                  src={featuredImage}
                />
              </div>
            )}
            <div className="HeroRecommendation-info">
              {renderHeroTitle()}
              <h2 className="HeroRecommendation-heading">
                {loading ? <LoadingText width={60} /> : heading}
              </h2>
              {loading ? (
                <div className="HeroRecommendation-body">
                  <>
                    <LoadingText width={100} />
                    <br />
                    <LoadingText width={80} />
                  </>
                </div>
              ) : (
                <div
                  className="HeroRecommendation-body"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={sanitizeUserHTML(description)}
                />
              )}
              {link}
            </div>
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
    siteIsReadOnly: state.site.readOnly,
    siteNotice: state.site.notice,
  };
};

const HeroRecommendation: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(HeroRecommendationBase);

export default HeroRecommendation;
