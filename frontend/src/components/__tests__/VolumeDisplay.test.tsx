import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatVolume, VolumeDisplay } from "../item/VolumeDisplay";

describe("formatVolume", () => {
    it("formats values below 1000 as plain numbers", () => {
        expect(formatVolume(0)).toBe("0");
        expect(formatVolume(1)).toBe("1");
        expect(formatVolume(999)).toBe("999");
    });

    it("formats thousands with k suffix", () => {
        expect(formatVolume(1000)).toBe("1k");
        expect(formatVolume(1500)).toBe("1k");
        expect(formatVolume(12300)).toBe("12k");
        expect(formatVolume(999900)).toBe("999k");
    });

    it("formats millions with m suffix", () => {
        expect(formatVolume(1_000_000)).toBe("1m");
        expect(formatVolume(1_500_000)).toBe("1m");
        expect(formatVolume(12_300_000)).toBe("12m");
        expect(formatVolume(3_000_000)).toBe("3m");
    });
});

describe("VolumeDisplay", () => {
    it("renders formatted volume with chaos icon and /h label", () => {
        render(<VolumeDisplay volume={1500} />);
        expect(screen.getByTestId("volume-value")).toHaveTextContent("1k");
        expect(screen.getByAltText("chaos")).toBeInTheDocument();
        expect(screen.getByText("/h")).toBeInTheDocument();
    });

    it("renders millions correctly", () => {
        render(<VolumeDisplay volume={2_000_000} />);
        expect(screen.getByTestId("volume-value")).toHaveTextContent("2m");
    });

    it("renders sub-1000 values plainly", () => {
        render(<VolumeDisplay volume={42} />);
        expect(screen.getByTestId("volume-value")).toHaveTextContent("42");
    });

    it("uses the provided currency", () => {
        render(<VolumeDisplay volume={1000} currency="divine" />);
        expect(screen.getByAltText("divine")).toBeInTheDocument();
    });
});
