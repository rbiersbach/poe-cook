import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextInput } from "../ui/TextInput";

describe("TextInput", () => {
    it("renders input and updates value", () => {
        const handleChange = vi.fn();
        render(
            <TextInput value="foo" onChange={handleChange} />
        );
        const input = screen.getByRole("textbox");
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue("foo");
        fireEvent.change(input, { target: { value: "bar" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("shows clear button when showClear is true and value is not empty", () => {
        const handleChange = vi.fn();
        const handleClear = vi.fn();
        render(
            <TextInput value="test" onChange={handleChange} showClear={true} onClear={handleClear} data-testid="text-input" />
        );
        const clearBtn = screen.getByTestId("clear-input-button");
        expect(clearBtn).toBeInTheDocument();
        fireEvent.click(clearBtn);
        expect(handleClear).toHaveBeenCalled();
    });

    it("does not show clear button when showClear is false", () => {
        render(
            <TextInput value="test" onChange={() => { }} showClear={false} />
        );
        expect(screen.queryByTestId("clear-input-button")).toBeNull();
    });

    it("does not show clear button when value is empty", () => {
        render(
            <TextInput value="" onChange={() => { }} showClear={true} />
        );
        expect(screen.queryByTestId("clear-input-button")).toBeNull();
    });
});
