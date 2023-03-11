// MyComponent.test.js
import { render } from '@testing-library/vue'
import MyComponent from '../src/components/EventCategoryScheduleComponent.vue'
import dayjs from 'dayjs';

test('it should work', () => {
    const categories = [{
        id: "beg_men_19",
        catdispname: "Beginner Men 19+",
        startTime: "07:00"
    }];
    const { getByText } = render(MyComponent, {
        props: {
            categories
            /* ... */
        }
    })

    // assert output
    getByText(categories[0].catdispname);
})