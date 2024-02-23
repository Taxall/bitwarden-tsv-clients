import { firstValueFrom } from "rxjs";

import { makeEncString } from "../../../spec";
import { mockAccountServiceWith } from "../../../spec/fake-account-service";
import { FakeSingleUserState } from "../../../spec/fake-state";
import { FakeStateProvider } from "../../../spec/fake-state-provider";
import { UserId } from "../../types/guid";
import { EncryptedString } from "../models/domain/enc-string";

import { BiometricStateService, DefaultBiometricStateService } from "./biometric-state.service";
import {
  DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT,
  ENCRYPTED_CLIENT_KEY_HALF,
  PROMPT_AUTOMATICALLY,
  PROMPT_CANCELLED,
  REQUIRE_PASSWORD_ON_START,
} from "./biometric.state";

describe("BiometricStateService", () => {
  let sut: BiometricStateService;
  const userId = "userId" as UserId;
  const encClientKeyHalf = makeEncString();
  const encryptedClientKeyHalf = encClientKeyHalf.encryptedString;
  const accountService = mockAccountServiceWith(userId);
  let stateProvider: FakeStateProvider;

  beforeEach(() => {
    stateProvider = new FakeStateProvider(accountService);

    sut = new DefaultBiometricStateService(stateProvider);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("requirePasswordOnStart$", () => {
    it("should track the requirePasswordOnStart state", async () => {
      const state = stateProvider.activeUser.getFake(REQUIRE_PASSWORD_ON_START);
      state.nextState(undefined);

      expect(await firstValueFrom(sut.requirePasswordOnStart$)).toBe(false);

      state.nextState(true);

      expect(await firstValueFrom(sut.requirePasswordOnStart$)).toBe(true);
    });
  });

  describe("encryptedClientKeyHalf$", () => {
    it("should track the encryptedClientKeyHalf state", async () => {
      const state = stateProvider.activeUser.getFake(ENCRYPTED_CLIENT_KEY_HALF);
      state.nextState(undefined);

      expect(await firstValueFrom(sut.encryptedClientKeyHalf$)).toBe(null);

      state.nextState(encryptedClientKeyHalf);

      expect(await firstValueFrom(sut.encryptedClientKeyHalf$)).toEqual(encClientKeyHalf);
    });
  });

  describe("setEncryptedClientKeyHalf", () => {
    it("should update the encryptedClientKeyHalf$", async () => {
      await sut.setEncryptedClientKeyHalf(encClientKeyHalf);

      expect(await firstValueFrom(sut.encryptedClientKeyHalf$)).toEqual(encClientKeyHalf);
    });
  });

  describe("setRequirePasswordOnStart", () => {
    it("should update the requirePasswordOnStart$", async () => {
      await sut.setRequirePasswordOnStart(true);

      expect(await firstValueFrom(sut.requirePasswordOnStart$)).toBe(true);
    });

    it("should remove the encryptedClientKeyHalf if the value is false", async () => {
      await sut.setEncryptedClientKeyHalf(encClientKeyHalf, userId);
      await sut.setRequirePasswordOnStart(false);

      const keyHalfState = stateProvider.getUser(
        userId,
        ENCRYPTED_CLIENT_KEY_HALF,
      ) as FakeSingleUserState<EncryptedString>;
      expect(await firstValueFrom(keyHalfState.state$)).toBe(null);
      expect(keyHalfState.nextMock).toHaveBeenCalledWith(null);
    });

    it("should not remove the encryptedClientKeyHalf if the value is true", async () => {
      await sut.setEncryptedClientKeyHalf(encClientKeyHalf);
      await sut.setRequirePasswordOnStart(true);

      expect(await firstValueFrom(sut.encryptedClientKeyHalf$)).toEqual(encClientKeyHalf);
    });
  });

  describe("getRequirePasswordOnStart", () => {
    it("should return the requirePasswordOnStart value", async () => {
      stateProvider.singleUser.mockFor(userId, REQUIRE_PASSWORD_ON_START.key, true);

      expect(await sut.getRequirePasswordOnStart(userId)).toBe(true);
    });
  });

  describe("require password on start callout", () => {
    it("should be false when not set", async () => {
      expect(await firstValueFrom(sut.dismissedRequirePasswordOnStartCallout$)).toBe(false);
    });

    it("should be true when set", async () => {
      await sut.setDismissedRequirePasswordOnStartCallout();

      expect(await firstValueFrom(sut.dismissedRequirePasswordOnStartCallout$)).toBe(true);
    });

    it("should update disk state", async () => {
      await sut.setDismissedRequirePasswordOnStartCallout();

      expect(
        stateProvider.activeUser.getFake(DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT).nextMock,
      ).toHaveBeenCalledWith([userId, true]);
    });
  });

  describe("prompt cancelled", () => {
    test("observable should be updated", async () => {
      await sut.setPromptCancelled();

      expect(await firstValueFrom(sut.promptCancelled$)).toBe(true);
    });

    it("should update state with set", async () => {
      await sut.setPromptCancelled();

      const nextMock = stateProvider.activeUser.getFake(PROMPT_CANCELLED).nextMock;
      expect(nextMock).toHaveBeenCalledWith([userId, true]);
      expect(nextMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("prompt automatically", () => {
    test("observable should be updated", async () => {
      await sut.setPromptAutomatically(true);

      expect(await firstValueFrom(sut.promptAutomatically$)).toBe(true);
    });

    it("should update state with setPromptAutomatically", async () => {
      await sut.setPromptAutomatically(true);

      const nextMock = stateProvider.activeUser.getFake(PROMPT_AUTOMATICALLY).nextMock;
      expect(nextMock).toHaveBeenCalledWith([userId, true]);
      expect(nextMock).toHaveBeenCalledTimes(1);
    });
  });
});