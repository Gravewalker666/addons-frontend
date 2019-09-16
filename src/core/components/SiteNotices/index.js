/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Notice from 'ui/components/Notice';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'amo/store';

import './styles.scss';

type Props = {||};

type MappedProps = {|
  siteIsReadOnly: boolean,
  siteNotice: string | null,
|};

type InternalProps = {|
  ...Props,
  ...MappedProps,
  i18n: I18nType,
|};

export class SiteNoticesBase extends React.Component<InternalProps> {
  render() {
    const { i18n, siteIsReadOnly, siteNotice } = this.props;

    const notices = [];

    if (siteNotice) {
      notices.push(
        <Notice className="SiteNotices" id="amo-site-notice" type="warning">
          {siteNotice}
        </Notice>,
      );
    }

    if (siteIsReadOnly) {
      notices.push(
        <Notice className="SiteNotices" id="amo-site-read-only" type="warning">
          {i18n.gettext(`Some features are temporarily disabled while we
            perform website maintenance. We'll be back to full capacity
            shortly.`)}
        </Notice>,
      );
    }

    return notices;
  }
}

const mapStateToProps = (state: AppState): MappedProps => {
  return {
    siteIsReadOnly: state.site.readOnly,
    siteNotice: state.site.notice,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(SiteNoticesBase);