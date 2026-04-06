import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../../constants/theme';
import { extractProblemsFromFile, ExtractedProblem } from '../../services/geminiService';

interface PdfUploadModalProps {
  visible: boolean;
  onDismiss: () => void;
  onExtractComplete: (problems: ExtractedProblem[]) => void;
}

type UploadState = 'idle' | 'selecting' | 'uploading' | 'analyzing' | 'error';

export default function PdfUploadModal({
  visible,
  onDismiss,
  onExtractComplete,
}: PdfUploadModalProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSelectPdf = async () => {
    try {
      setState('selecting');

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setState('idle');
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);
      setState('analyzing');

      // Gemini로 문제 추출
      const extractionResult = await extractProblemsFromFile(file.uri, 'application/pdf');

      if (extractionResult.success) {
        onExtractComplete(extractionResult.problems);
        resetAndClose();
      } else {
        setErrorMessage(extractionResult.error || '문제 추출에 실패했습니다');
        setState('error');
      }
    } catch (error) {
      console.error('PDF 선택 오류:', error);
      setErrorMessage('파일을 처리하는 중 오류가 발생했습니다');
      setState('error');
    }
  };

  const handleSelectImage = async () => {
    try {
      setState('selecting');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (result.canceled) {
        setState('idle');
        return;
      }

      const image = result.assets[0];
      const imageName = image.uri.split('/').pop() || '이미지';
      setFileName(imageName);
      setState('analyzing');

      // mimeType 결정
      const extension = image.uri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'webp') mimeType = 'image/webp';
      else if (extension === 'gif') mimeType = 'image/gif';

      // Gemini로 문제 추출
      const extractionResult = await extractProblemsFromFile(image.uri, mimeType);

      if (extractionResult.success) {
        onExtractComplete(extractionResult.problems);
        resetAndClose();
      } else {
        setErrorMessage(extractionResult.error || '문제 추출에 실패했습니다');
        setState('error');
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      setErrorMessage('이미지를 처리하는 중 오류가 발생했습니다');
      setState('error');
    }
  };

  const resetAndClose = () => {
    setState('idle');
    setFileName('');
    setErrorMessage('');
    onDismiss();
  };

  const getStateContent = () => {
    switch (state) {
      case 'idle':
      case 'selecting':
        return (
          <>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="file-document-multiple" size={64} color={colors.primary} />
            </View>
            <Text style={styles.title}>문제 추출</Text>
            <Text style={styles.description}>
              수학 문제가 포함된 PDF 또는 이미지를 업로드하면{'\n'}
              AI가 문제를 추출하고 난이도를 분류합니다
            </Text>
            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                onPress={handleSelectPdf}
                style={styles.selectButton}
                loading={state === 'selecting'}
                icon="file-pdf-box"
              >
                PDF 선택
              </Button>
              <Button
                mode="outlined"
                onPress={handleSelectImage}
                style={styles.selectButton}
                loading={state === 'selecting'}
                icon="image"
              >
                이미지 선택
              </Button>
            </View>
          </>
        );

      case 'analyzing':
        return (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.title}>AI 분석 중...</Text>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.description}>
              문제를 추출하고 난이도를 분류하고 있습니다{'\n'}
              잠시만 기다려주세요
            </Text>
          </>
        );

      case 'error':
        return (
          <>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
            </View>
            <Text style={styles.title}>오류 발생</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <View style={styles.errorButtons}>
              <Button
                mode="outlined"
                onPress={resetAndClose}
                style={styles.errorButton}
              >
                취소
              </Button>
              <Button
                mode="contained"
                onPress={handleSelectPdf}
                style={styles.errorButton}
              >
                다시 시도
              </Button>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={state === 'analyzing' ? undefined : resetAndClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.content}>
          {getStateContent()}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.xl,
    borderRadius: 16,
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  fileName: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
  },
  selectButton: {
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorButton: {
    flex: 1,
  },
});
