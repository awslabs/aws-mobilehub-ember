/*
* Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
* SPDX-License-Identifier: MIT-0
*/
import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { set } from '@ember/object';
import Ember from 'ember';
const { Logger } = Ember;

export default Component.extend({
  cognito: inject(),
  authentication: inject(),
  username: undefined,
  email: undefined,
  password: "",
  emailInvalid: true,
  passInvalid: true,
  usernameInvalid: true,
  confirmationSent: undefined,
  confirmationCode: "",
  confirmed: undefined,
  registering: false,
  signingIn: true,
  passValid: computed('passValid', function () {
    if (this.get('password').length <= 6) {
      return true;
    } else {
      return false;
    }
  }),
  actions: {
    validateLoginEmail() {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      var email = this.get('username');
      if (re.test(email)) {
        this.set('emailInvalid', false);
      } else {
        this.set('emailInvalid', true);
      }
    },
    validateLoginPassword() {
      if (this.get('password').length <= 6) {
        this.set('passInvalid', true);
      } else {
        this.set('passInvalid', false);
      }
    },
    validateLoginUsername() {
      if (this.get('username').length <= 3) {
        this.set('usernameInvalid', true);
      } else {
        this.set('usernameInvalid', false);
      }
    },
    logout() {
      var auth = this.get('authentication');
      auth.logout();
    },
    login() {
      this.set('authenticating', true);
      this.set('error', undefined);
      let that = this,
        username = this.get('username'),
        password = this.get('password');
      if (username && password) {
        let cognito = this.get('cognito');
        cognito.authenticate(username, password)
          .then(function (/*response*/) {
            that.set('authenticating', false);
            Logger.debug('login with cognito succeeded.');
          }, function (error) {
            that.set('error', error.toString().split(':')[1]);
            that.set('authenticating', false);
          });
      }
    },
    showConfirmation() {
      this.set('confirmationSent', true);
      this.set('signingIn', false);
      this.set('registering', false);
    },
    cancelConfirmation() {
      this.set('confirmationSent', false);
      this.set('signingIn', true);
      this.set('registering', false);
      this.set('error', undefined);
    },
    resendConfirmation() {
      this.set('resentConfirmation', false);
      let cognito = this.get('cognito'),
        email = this.get('username'),
        that = this;
      cognito.resendConfirmation(email)
        .then(function (data) {
          Logger.debug(data);
          set(that, 'resentConfirmation', data);
        }, function (err) {
          Logger.debug(err);
          set(that, 'error', err);
        });
    },
    confirmRegistration() {
      var that = this;
      this.set('confirming', true);
      this.set('error', undefined);
      this.set('confirmed', undefined);
      var cognito = this.get('cognito'),
        username = this.get('username'),
        code = this.get('confirmationCode');
      cognito.confirm(username, code)
        .then(function (data) {
          Logger.debug(data);
          set(that, 'confirming', undefined);
          set(that, 'confirmationSent', undefined);
          set(that, 'confirmed', true);
          set(that, 'signingIn', true);
          set(that, 'registering', undefined);
        }, function (err) {
          Logger.debug(err);
          set(that, 'error', err);
          set(that, 'confirming', undefined);
          set(that, 'confirmed', undefined);
        });
    },
    cancelRegister() {
      this.set('registering', false);
      this.set('signingIn', true);
    },
    register() {
      var that = this,
        registering = this.get('registering');

      if (registering) {
        this.set('signingIn', false);
        this.set('authenticating', true);
        this.set('error', undefined);
        var password = this.get('password'),
          email = this.get('email'),
          username = this.get('username');
        var cognito = this.get('cognito');
        cognito.register(email, username, password)
          .then(function (response) {
            Logger.debug(response);
            that.set('authenticating', false);
            that.set('confirmationSent', true);
          }, function (error) {
            Logger.debug(error);
            that.set('authenticating', false);
            that.set('confirmationSent', false);
            var msgArray = error.toString().split(':');
            var message = "";
            for (var i = 1; i <= msgArray.length; i++) {
              if (msgArray[i] !== undefined) {
                message += msgArray[i] + '. ';
              }
            }
            that.set('error', message);
          });
      } else {
        this.set('registering', true);
        this.set('signingIn', false);
      }
    }
  }
});
