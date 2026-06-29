import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabaseClient';

export function usePushNotifications(currentUser) {
  useEffect(() => {
    if (!currentUser) return;
    
    // 모바일 기기(안드로이드/iOS)에서만 푸시 알림 등록
    if (Capacitor.isNativePlatform()) {
      registerPushNotifications();
    }

    async function registerPushNotifications() {
      // 권한 요청
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('User denied push permission');
        return;
      }

      // 토큰 획득 성공 시
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);
        // Supabase DB의 users 테이블에 푸시 토큰 업데이트
        await supabase
          .from('users')
          .update({ push_token: token.value })
          .eq('id', currentUser.id);
      });

      // 토큰 획득 실패 시
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // 알림 수신 시 (포그라운드)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
        // alert(notification.title + "\n" + notification.body);
      });

      // 알림 클릭 시 (백그라운드에서 열기)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
      });

      // 기기를 FCM/APNs에 등록 요청
      await PushNotifications.register();
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [currentUser]);
}
